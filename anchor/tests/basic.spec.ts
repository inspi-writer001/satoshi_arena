import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token'
import { SatoshiArena } from '../target/types/satoshi_arena'
import { fileURLToPath } from 'url'

import * as fs from 'fs'
import * as path from 'path'
import { associatedAddress } from '@coral-xyz/anchor/dist/cjs/utils/token'

const walletPath = path.resolve(__dirname, 'wallet.json')

const creatorWalletPath = path.resolve(__dirname, 'creator_wallet.json')
const playerWalletPath = path.resolve(__dirname, 'player_wallet.json')
const gameStorePath = path.resolve(__dirname, 'game_store-keypair.json')

// Read and parse the wallet file
const creatorWalletData = JSON.parse(fs.readFileSync(creatorWalletPath, 'utf-8'))
const playerWalletData = JSON.parse(fs.readFileSync(playerWalletPath, 'utf-8'))
const gameStoreData = JSON.parse(fs.readFileSync(gameStorePath, 'utf-8'))
const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'))

const creatorSecretKey = new Uint8Array(creatorWalletData)
const playerSecretKey = new Uint8Array(playerWalletData)
const secretKey = new Uint8Array(walletData)
const gameStoreSecretKey = new Uint8Array(gameStoreData)

const signer_wallet = anchor.web3.Keypair.fromSecretKey(secretKey)

const player_wallet = anchor.web3.Keypair.fromSecretKey(playerSecretKey)
const creator_wallet = anchor.web3.Keypair.fromSecretKey(creatorSecretKey)
const game_store_wallet = anchor.web3.Keypair.fromSecretKey(gameStoreSecretKey)

const token_mint = new anchor.web3.PublicKey('6mWfrWzYf5ot4S8Bti5SCDRnZWA5ABPH1SNkSq4mNN1C') // demo zbtc address

describe('satoshi_arena', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  let treasury = new anchor.web3.PublicKey('6FJdcfzFHrV7LRsMaojS6aebeCW8RXoKtoyJQu5nN4ik')

  const program = anchor.workspace.SatoshiArena as Program<SatoshiArena>

  it('should initialize the program state', async () => {
    try {
      const tx = await program.methods
        .initialize(token_mint, treasury, 10)
        .accounts({
          globalState: game_store_wallet.publicKey,
          authority: signer_wallet.publicKey,
        })
        .signers([game_store_wallet, signer_wallet])
        .rpc()
      console.log('Your transaction signature', tx)
    } catch (err) {
      console.error('Test failed:', err)
      throw err
    }
  }, 10_000)

  const [pda_state_account, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('satoshi_arena'), creator_wallet.publicKey.toBuffer()],
    program.programId,
  )

  const [pda_vault_token, __bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), pda_state_account.toBuffer()],
    program.programId,
  )

  // it('should initialize a game', async () => {
  //   try {
  //     let total_health = 1
  //     let pool_amount = 1 * anchor.web3.LAMPORTS_PER_SOL

  //     console.log(creator_wallet.publicKey.toBase58())

  //     const creator_token_account = await getOrCreateAssociatedTokenAccount(
  //       provider.connection,
  //       creator_wallet,
  //       token_mint,
  //       creator_wallet.publicKey,
  //     )

  //     console.log('associated token account: ', creator_token_account)

  //     const tx = await program.methods
  //       .initializeGame(new anchor.BN(total_health), new anchor.BN(pool_amount))
  //       .accounts({
  //         creatorTokenAccount: creator_token_account.address,
  //         tokenMint: token_mint.toBase58(),
  //         signer: creator_wallet.publicKey,
  //       })
  //       .signers([creator_wallet])
  //       .rpc()
  //     console.log('Your transaction signature', tx)
  //   } catch (err) {
  //     console.error('Test failed:', err)
  //     throw err // rethrow to let Jest mark it as failed
  //   }
  // }, 10_000_000)

  // it('player should initialize a game', async () => {
  //   // Add your test here.
  //   try {
  //     let total_health = 1
  //     let pool_amount = 2 * anchor.web3.LAMPORTS_PER_SOL

  //     console.log(player_wallet.publicKey.toBase58())

  //     const creator_token_account = await getOrCreateAssociatedTokenAccount(
  //       provider.connection,
  //       player_wallet,
  //       token_mint,
  //       player_wallet.publicKey,
  //     )

  //     console.log('associated token account: ', creator_token_account)

  //     const tx = await program.methods
  //       .initializeGame(new anchor.BN(total_health), new anchor.BN(pool_amount))
  //       .accounts({
  //         creatorTokenAccount: creator_token_account.address,
  //         tokenMint: token_mint.toBase58(),
  //         // stateAccount: pda_state_account,
  //         signer: player_wallet.publicKey,
  //         // vaultTokenAccount: pda_vault_token,
  //       })
  //       .signers([player_wallet])
  //       .rpc()
  //     console.log('Your transaction signature', tx)
  //   } catch (err) {
  //     console.error('Test failed:', err)
  //     throw err // rethrow to let Jest mark it as failed
  //   }
  // }, 10_000_000)

  // it('should join a game', async () => {
  //   // Add your test here.
  //   try {
  //     console.log(player_wallet.publicKey.toBase58())

  //     // console.log(await program.account.gameSessionHealth.all())

  //     const player_token_account = await getOrCreateAssociatedTokenAccount(
  //       provider.connection,
  //       player_wallet,
  //       token_mint,
  //       player_wallet.publicKey,
  //     )

  //     console.log('associated token account: ', player_token_account)

  //     const tx = await program.methods
  //       .joinGame()
  //       .accounts({
  //         playerTokenAccount: player_token_account.address,
  //         vaultTokenAccount: pda_vault_token,
  //         stateAccount: pda_state_account,
  //         // stateAccount: pda_state_account,
  //         player: player_wallet.publicKey,
  //         // vaultTokenAccount: pda_vault_token,
  //       })
  //       .signers([player_wallet])
  //       .rpc()
  //     console.log('Your transaction signature', tx)
  //   } catch (err) {
  //     console.error('Test failed:', err)
  //     throw err // rethrow to let Jest mark it as failed
  //   }
  // }, 10_000_000)

  // it('should play joined game', async () => {
  //   // Add your test here.
  //   try {
  //     console.log(player_wallet.publicKey.toBase58())

  //     const tx = await program.methods
  //       .playTurn({ scissors: {} })
  //       .accounts({
  //         stateAccount: pda_state_account,
  //         signer: player_wallet.publicKey,
  //       })
  //       .signers([player_wallet])
  //       .rpc()
  //     console.log('Your transaction signature', tx)
  //   } catch (err) {
  //     console.error('Test failed:', err)
  //     throw err // rethrow to let Jest mark it as failed
  //   }
  // }, 10_000_000)

  // it('should play joined game', async () => {
  //   // Add your test here.
  //   try {
  //     console.log(creator_wallet.publicKey.toBase58())

  //     const tx = await program.methods
  //       .playTurn({ paper: {} })
  //       .accounts({
  //         stateAccount: pda_state_account,
  //         signer: creator_wallet.publicKey,
  //       })
  //       .signers([creator_wallet])
  //       .rpc()
  //     console.log('Your transaction signature', tx)
  //   } catch (err) {
  //     console.error('Test failed:', err)
  //     throw err // rethrow to let Jest mark it as failed
  //   }
  // }, 10_000_000)

  // it('should resolve game', async () => {
  //   // Add your test here.
  //   try {
  //     console.log(creator_wallet.publicKey.toBase58())

  //     const tx = await program.methods
  //       .resolveTurn()
  //       .accounts({
  //         stateAccount: pda_state_account,
  //       })
  //       .signers([])
  //       .rpc()
  //     console.log('Your transaction signature', tx)
  //   } catch (err) {
  //     console.error('Test failed:', err)
  //     throw err // rethrow to let Jest mark it as failed
  //   }
  // }, 10_000_000)

  // it('should claim won game', async () => {
  //   // Add your test here.
  //   try {
  //     console.log(player_wallet.publicKey.toBase58())
  //     console.log('treasury', treasury)

  //     const player_token_account = await getOrCreateAssociatedTokenAccount(
  //       provider.connection,
  //       player_wallet,
  //       token_mint,
  //       player_wallet.publicKey,
  //     )

  //     const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
  //       provider.connection,
  //       player_wallet, // or signer_wallet, any payer
  //       token_mint,
  //       treasury, // this must be the treasury wallet you initialized earlier
  //     )

  //     console.log('treasury', treasury)
  //     console.log('treasuryTA', treasuryTokenAccount)

  //     const tx = await program.methods
  //       .claimReward()
  //       .accounts({
  //         claimerTokenAccount: player_token_account.address,
  //         globalState: game_store_wallet.publicKey,
  //         stateAccount: pda_state_account,
  //         treasuryTokenAccount: treasuryTokenAccount.address,
  //         claimer: player_wallet.publicKey,
  //         tokenMint: token_mint,
  //       })
  //       .signers([player_wallet])
  //       .rpc()
  //     console.log('Your transaction signature', tx)
  //   } catch (err) {
  //     console.error('Test failed:', err)
  //     throw err // rethrow to let Jest mark it as failed
  //   }
  // }, 10_000_000)
})
