use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::clock::Clock;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

mod errors;

use errors::SatoshiError;

declare_id!("BnWSgutGqnvM2mrGU4m1wCDGdvofwkfJCT4K3pEe3jcG");

#[program]
pub mod satoshi_arena {
    use super::*;
    pub fn initialize(
        ctx: Context<Initialize>,
        token_mint: Pubkey,
        treasury: Pubkey,
        treasury_cut_bps: u16, // Basis points (e.g., 1000 = 10%)
    ) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;

        // Ensure the project is not already initialized
        require!(
            !global_state.is_initialized,
            SatoshiError::AlreadyInitialized
        );

        // Set the token mint, treasury, and mark as initialized
        global_state.token_mint = token_mint;
        global_state.treasury = treasury;
        global_state.treasury_cut_bps = treasury_cut_bps;
        global_state.is_initialized = true;
        global_state.owner = *ctx.accounts.authority.key;

        msg!("Program initiialised successfully: {:?}", global_state);

        Ok(())
    }

    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        total_health: u8,
        pool_amount: u64,
    ) -> Result<()> {
        let game = &mut ctx.accounts.state_account;
        let creator = &ctx.accounts.signer;

        // Transfer zBTC from creator to vault PDA
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.creator_token_account.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: creator.to_account_info(),
                },
            ),
            pool_amount,
        )?;

        game.creator = creator.key();
        game.creator_health = total_health;
        game.total_health = total_health as u32;
        game.pool_amount = pool_amount;
        game.creator_can_play = true;
        game.player_can_play = false;
        game.player_action = PlayerAction::None;
        game.creator_action = PlayerAction::None;
        game.winner = None;

        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game = &mut ctx.accounts.state_account;

        // Ensure player hasn't already joined
        require!(game.player.is_none(), SatoshiError::AlreadyJoined);

        // Transfer zBTC from player to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.player_token_account.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: ctx.accounts.player.to_account_info(),
                },
            ),
            game.pool_amount,
        )?;

        // Set the player in the game state
        game.player = Some(ctx.accounts.player.key());
        game.player_health = game.total_health;
        game.player_can_play = true;

        Ok(())
    }

    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        let game = &ctx.accounts.state_account;
        let global_state = &ctx.accounts.global_state;

        let winner = if game.creator_health == 0 {
            game.player.unwrap()
        } else if game.player_health == 0 {
            game.creator
        } else {
            return Err(SatoshiError::GameNotOver.into());
        };
        require!(
            winner == ctx.accounts.claimer.key(),
            SatoshiError::NotWinner
        );

        let total_pool = game.pool_amount * 2;

        let bump = ctx.bumps.vault_authority;
        let account = ctx.accounts.state_account.key();
        let vault_seeds = &[b"vault_authority".as_ref(), account.as_ref(), &[bump]];

        let treasury_fee = total_pool * global_state.treasury_cut_bps as u64 / 10_000;
        let winner_amount = total_pool - treasury_fee;

        // Send fee to treasury
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                &[vault_seeds],
            ),
            treasury_fee,
        )?;

        // Send reward to winner
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.claimer_token_account.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                &[vault_seeds],
            ),
            winner_amount,
        )?;

        Ok(())
    }

    pub fn play_turn(ctx: Context<PlayTurn>, action: PlayerAction) -> Result<()> {
        let game = &mut ctx.accounts.state_account;
        let signer = ctx.accounts.signer.key();
        let clock = Clock::get()?;

        require!(
            game.creator == signer || game.player == Some(signer),
            SatoshiError::NotAParticipant
        );

        if game.creator == signer {
            require!(
                game.creator_action == PlayerAction::None,
                SatoshiError::NotTurn
            );
            game.creator_action = action;
            game.creator_can_play = false;
        } else if game.player == Some(signer) {
            require!(
                game.player_action == PlayerAction::None,
                SatoshiError::NotTurn
            );
            game.player_action = action;
            game.player_can_play = false;
        }

        // Update last play timestamp
        game.last_turn_timestamp = clock.unix_timestamp;

        Ok(())
    }

    pub fn resolve_turn(ctx: Context<ResolveTurn>) -> Result<()> {
        let game = &mut ctx.accounts.state_account;

        require!(
            game.creator_action != PlayerAction::None,
            SatoshiError::IncompleteTurn
        );
        require!(
            game.player_action != PlayerAction::None,
            SatoshiError::IncompleteTurn
        );

        let creator_action = game.creator_action.clone();
        let player_action = game.player_action.clone();

        let result = match (creator_action, player_action) {
            (PlayerAction::Rock, PlayerAction::Scissors)
            | (PlayerAction::Scissors, PlayerAction::Paper)
            | (PlayerAction::Paper, PlayerAction::Rock) => {
                Some(game.player_health = game.player_health.saturating_sub(1))
            }

            (PlayerAction::Scissors, PlayerAction::Rock)
            | (PlayerAction::Paper, PlayerAction::Scissors)
            | (PlayerAction::Rock, PlayerAction::Paper) => {
                Some(game.creator_health = game.creator_health.saturating_sub(1))
            }

            _ => None, // Draw
        };

        // Check for game over
        if game.creator_health == 0 {
            game.winner = Some(game.player.unwrap());
        } else if game.player_health == 0 {
            game.winner = Some(game.creator);
        } else {
            // Reset actions
            game.creator_action = PlayerAction::None;
            game.player_action = PlayerAction::None;
            game.creator_can_play = true;
            game.player_can_play = true;
        }

        Ok(())
    }

    pub fn force_resolve_if_timeout(ctx: Context<ResolveTurn>) -> Result<()> {
        let game = &mut ctx.accounts.state_account;
        let clock = Clock::get()?;
        let now = clock.unix_timestamp;
        let timeout_duration = 180; // 3 minutes

        // Only proceed if it's been too long since last turn
        require!(
            now - game.last_turn_timestamp >= timeout_duration,
            SatoshiError::NotTimedOut
        );

        // If one player hasn't played yet, the other wins the round
        if game.creator_action != PlayerAction::None && game.player_action == PlayerAction::None {
            game.player_health = game.player_health.saturating_sub(1);
        } else if game.player_action != PlayerAction::None
            && game.creator_action == PlayerAction::None
        {
            game.creator_health = game.creator_health.saturating_sub(1);
        } else {
            return Err(SatoshiError::InvalidForceResolve.into());
        }

        // Reset the round
        game.creator_action = PlayerAction::None;
        game.player_action = PlayerAction::None;
        game.creator_can_play = true;
        game.player_can_play = true;
        game.last_turn_timestamp = now;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + GameSessionHealth::INIT_SPACE,
        seeds = [b"satoshi_arena", signer.key().as_ref()],
        bump
    )]
    pub state_account: Account<'info, GameSessionHealth>,

    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = signer,
        seeds = [b"vault", state_account.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = vault_authority
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"vault_authority", state_account.key().as_ref()],
        bump
    )]
    /// CHECK: PDA that will own the vault_token_account
    pub vault_authority: UncheckedAccount<'info>,

    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + GlobalState::INIT_SPACE)]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateGame<'info> {
    #[account(mut)]
    state_account: Account<'info, GameSessionHealth>,

    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub state_account: Account<'info, GameSessionHealth>,

    #[account(mut)]
    pub claimer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", state_account.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(address = global_state.token_mint)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        seeds = [b"vault_authority", state_account.key().as_ref()],
        bump
    )]
    /// CHECK: PDA that owns the vault token account
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = claimer_token_account.owner == claimer.key()
    )]
    pub claimer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = treasury_token_account.owner == global_state.treasury,
        constraint = treasury_token_account.mint == global_state.token_mint
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(constraint = global_state.token_mint == claimer_token_account.mint)]
    pub global_state: Account<'info, GlobalState>,

    pub token_program: Program<'info, Token>,
}
#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>, // The player joining the game
    #[account(mut)]
    pub player_token_account: Box<Account<'info, TokenAccount>>, // The player's token account
    #[account(mut)]
    pub vault_token_account: Box<Account<'info, TokenAccount>>, // The vault token account
    #[account(mut)]
    pub state_account: Box<Account<'info, GameSessionHealth>>, // The game session state account
    pub token_program: Program<'info, Token>, // The token program for transferring tokens
}

#[account]
#[derive(InitSpace)]
pub struct GameSessionHealth {
    pub creator: Pubkey,
    pub player: Option<Pubkey>,
    pub player_can_play: bool,
    pub creator_can_play: bool,
    pub total_health: u32,
    pub player_health: u32,
    pub creator_health: u8,
    player_action: PlayerAction,
    creator_action: PlayerAction,
    pub pool_amount: u64,
    pub winner: Option<Pubkey>,
    pub last_turn_timestamp: i64,
}

#[derive(Accounts)]
pub struct PlayTurn<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub state_account: Account<'info, GameSessionHealth>,
}

#[derive(Accounts)]
pub struct ResolveTurn<'info> {
    #[account(mut)]
    pub state_account: Account<'info, GameSessionHealth>,
}

#[account]
#[derive(InitSpace, Debug)]
pub struct GlobalState {
    pub token_mint: Pubkey,    // Token mint address
    pub treasury: Pubkey,      // Treasury address
    pub treasury_cut_bps: u16, // Treasury cut in basis points (e.g., 100 = 1%)
    pub is_initialized: bool,  // Flag to check if the project is initialized
    pub owner: Pubkey,         // Owner of the program
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, InitSpace, PartialEq)]
pub enum PlayerAction {
    None,
    Rock,
    Paper,
    Scissors,
}
