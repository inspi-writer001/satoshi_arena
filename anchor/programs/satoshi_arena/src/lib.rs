use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

mod errors;

use errors::SatoshiError;

declare_id!("4AC91QE69YPBKTPA2CMNsvAkEAmr7LNC6N7hevR8Ld6R");

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

        let bump = ctx.bumps.vault_token_account;
        let account = ctx.accounts.state_account.key();
        let vault_seeds = &[b"satoshi_arena".as_ref(), account.as_ref(), &[bump]];

        let treasury_fee = total_pool * global_state.treasury_cut_bps as u64 / 10_000;
        let winner_amount = total_pool - treasury_fee;

        // Send fee to treasury
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
                    authority: ctx.accounts.vault_token_account.to_account_info(),
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
                    authority: ctx.accounts.vault_token_account.to_account_info(),
                },
                &[vault_seeds],
            ),
            winner_amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(init, payer = signer, space = 8 + GameSessionHealth::INIT_SPACE, seeds=[b"satoshi_arena", signer.key().as_ref()], bump)]
    pub state_account: Account<'info, GameSessionHealth>,

    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = signer,
        seeds = [b"vault", state_account.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = vault_token_account,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
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
        seeds = [b"satoshi_arena", state_account.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA that owns the tokens
    pub vault_token_account: AccountInfo<'info>,

    #[account(
        mut,
        constraint = claimer_token_account.owner == claimer.key()
    )]
    pub claimer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    #[account(constraint = global_state.token_mint == claimer_token_account.mint)]
    pub global_state: Account<'info, GlobalState>,
    #[account(
    mut,
    constraint = treasury_token_account.owner == global_state.treasury,
    constraint = treasury_token_account.mint == global_state.token_mint
)]
    pub treasury_token_account: Account<'info, TokenAccount>,
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
    pub player_action: PlayerAction,
    pub creator_action: PlayerAction,
    pub pool_amount: u64,
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

#[derive(Clone, AnchorSerialize, AnchorDeserialize, InitSpace)]
enum PlayerAction {
    None,
    Rock,
    Paper,
    Scissors,
}
