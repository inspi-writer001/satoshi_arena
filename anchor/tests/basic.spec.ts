import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token'
import { SatoshiArena } from '../target/types/satoshi_arena'
import { fileURLToPath } from 'url'

import * as fs from 'fs'
import * as path from 'path'
import { associatedAddress } from '@coral-xyz/anchor/dist/cjs/utils/token'
// Path to the wallet JSON file
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

const walletPath = path.resolve(__dirname, 'wallet.json')

const creatorWalletPath = path.resolve(__dirname, 'creator_wallet.json')
const playerWalletPath = path.resolve(__dirname, 'player_wallet.json')

// Read and parse the wallet file
const creatorWalletData = JSON.parse(fs.readFileSync(creatorWalletPath, 'utf-8'))
const playerWalletData = JSON.parse(fs.readFileSync(playerWalletPath, 'utf-8'))
const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'))
// H4FUhFia8MQUxGVx9a346Ht4mpMi9HdcJDsN3W5LTtDQ

const creatorSecretKey = new Uint8Array(creatorWalletData)
const playerSecretKey = new Uint8Array(playerWalletData)
const secretKey = new Uint8Array(walletData)

const signer_wallet = anchor.web3.Keypair.fromSecretKey(secretKey)

const player_wallet = anchor.web3.Keypair.fromSecretKey(playerSecretKey)
const creator_wallet = anchor.web3.Keypair.fromSecretKey(creatorSecretKey)

const token_mint = new anchor.web3.PublicKey('6mWfrWzYf5ot4S8Bti5SCDRnZWA5ABPH1SNkSq4mNN1C')

describe('satoshi_arena', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  // const new_account = anchor.web3.Keypair.generate()
  let priv_key = [
    154, 181, 76, 22, 221, 80, 199, 57, 86, 227, 112, 184, 154, 97, 175, 237, 164, 103, 159, 128, 138, 240, 216, 251,
    18, 125, 0, 161, 98, 106, 224, 136, 220, 116, 108, 37, 16, 228, 102, 156, 132, 165, 212, 59, 183, 145, 198, 199, 89,
    207, 143, 56, 131, 89, 148, 58, 163, 13, 234, 183, 166, 125, 126, 29,
  ]

  const secretKey = Uint8Array.from(priv_key)
  // let priv_key = new_account.secretKey

  const new_account = anchor.web3.Keypair.fromSecretKey(secretKey)

  let pub_key = new anchor.web3.PublicKey('FqZfAs1au4ZyifLkNYA3VZsfnEn9A9GEyne1SFnFJTHn')
  let treasury = new anchor.web3.PublicKey('6FJdcfzFHrV7LRsMaojS6aebeCW8RXoKtoyJQu5nN4ik')
  // let pub_key = new_account.publicKey

  // console.log('this is pub_key', pub_key.toBase58())

  // console.log('this is priv_key', priv_key)

  const program = anchor.workspace.SatoshiArena as Program<SatoshiArena>

  // it('should run the program', async () => {
  //   // Add your test here.
  //   try {
  //     const tx = await program.methods
  //       .initialize(token_mint, treasury, 10)
  //       .accounts({
  //         globalState: pub_key,
  //         authority: signer_wallet.publicKey,
  //       })
  //       .signers([new_account, signer_wallet])
  //       .rpc()
  //     console.log('Your transaction signature', tx)
  //   } catch (err) {
  //     console.error('Test failed:', err)
  //     throw err // rethrow to let Jest mark it as failed
  //   }
  // }, 10_000)

  const [pda_state_account, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('satoshi_arena'), creator_wallet.publicKey.toBuffer()],
    program.programId,
  )

  const [pda_vault_token, __bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), pda_state_account.toBuffer()],
    program.programId,
  )

  // it('should initialize a game', async () => {
  //   // Add your test here.
  //   try {
  //     let total_health = 10
  //     let pool_amount = 10 * anchor.web3.LAMPORTS_PER_SOL

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
  //         // stateAccount: pda_state_account,
  //         signer: creator_wallet.publicKey,
  //         // vaultTokenAccount: pda_vault_token,
  //       })
  //       .signers([creator_wallet])
  //       .rpc()
  //     console.log('Your transaction signature', tx)
  //   } catch (err) {
  //     console.error('Test failed:', err)
  //     throw err // rethrow to let Jest mark it as failed
  //   }
  // }, 10_000_000)

  it('should join a game', async () => {
    // Add your test here.
    try {
      console.log(player_wallet.publicKey.toBase58())

      // console.log(await program.account.gameSessionHealth.all())

      const player_token_account = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        player_wallet,
        token_mint,
        player_wallet.publicKey,
      )

      console.log('associated token account: ', player_token_account)

      const tx = await program.methods
        .joinGame()
        .accounts({
          playerTokenAccount: player_token_account.address,
          vaultTokenAccount: pda_vault_token,
          stateAccount: pda_state_account,
          // stateAccount: pda_state_account,
          player: player_wallet.publicKey,
          // vaultTokenAccount: pda_vault_token,
        })
        .signers([player_wallet])
        .rpc()
      console.log('Your transaction signature', tx)
    } catch (err) {
      console.error('Test failed:', err)
      throw err // rethrow to let Jest mark it as failed
    }
  }, 10_000_000)
})
