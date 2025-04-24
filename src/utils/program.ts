import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'

import idl from '../../anchor/target/idl/satoshi_arena.json'
import { SatoshiArena } from '../../anchor/target/types/satoshi_arena'

const programId = new PublicKey(idl.address)
const tokenMint = new PublicKey('6mWfrWzYf5ot4S8Bti5SCDRnZWA5ABPH1SNkSq4mNN1C') //TODO change to Token Mint of zBTC

export const getProvider = () => {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

  const wallet = window.solana
  if (!wallet) throw new Error('Solana wallet not found')

  //   const wallet = window.solana as Wallet
  return new AnchorProvider(connection, wallet, {
    preflightCommitment: 'processed',
  })
}

export const getProgram = () => {
  const provider = getProvider()
  return new Program<SatoshiArena>(idl as any, provider)
}

export { tokenMint, programId }
