import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token'
import { useNavigate } from 'react-router-dom'
import * as anchor from '@coral-xyz/anchor'
import { useGameStore } from '../store/GameStore'
import { tokenMint, getProvider, getProgram } from '../utils/program'
import bgImage from '/background/ree.jpg'

import { PublicKey, Transaction } from '@solana/web3.js'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Board from '/background/MessageBoard.png'
import CreateGame from '/action_buttons/CreateGame.png'

const CreateGameSession = () => {
  const [totalHealth, setTotalHealth] = useState(5)
  const [poolAmount, setPoolAmount] = useState(1)
  const [loading, setLoading] = useState(false)

  //   const wallet = useAnchorWallet()
  const { wallet, publicKey, connected } = useWallet()
  const { setTransitionTrigger } = useGameStore()
  const navigate = useNavigate()

  const handleCreateGame = async () => {
    if (!wallet || !wallet.adapter.publicKey || !publicKey) return

    try {
      setLoading(true)
      const provider = getProvider()
      const program = getProgram()

      const ata = await getOrCreateAssociatedTokenAccountWithProvider(provider, publicKey, tokenMint)

      const tx = await program.methods
        .initializeGame(new anchor.BN(totalHealth), new anchor.BN(poolAmount * anchor.web3.LAMPORTS_PER_SOL))
        .accounts({
          creatorTokenAccount: ata.address,
          tokenMint: tokenMint,
          signer: wallet.adapter.publicKey,
        })
        .signers([])
        .rpc()

      console.log('Game Created! TX:', tx)
      setTransitionTrigger(true)
      setTimeout(() => navigate('/sessions'), 500)
    } catch (error) {
      console.error('Error initializing game:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center relative justify-center w-full min-h-screen bg-cover bg-center bg-no-repeat text-[#E4E2DC]"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <img src={Board} className="absolute w-full md:max-w-xl" />
      <div className=" p-8 rounded-xl max-w-md w-full relative z-20">
        <div className="flex justify-end mb-6 absolute right-4 md:right-0 -mt-8 md:-mt-28">
          <WalletMultiButton
            style={{
              background: '#bd761a',
            }}
          />
        </div>

        <h1 className="md:text-3xl text-2xl font-bold text-center md:mt-0 mt-24 mb-6 pirata-one text-[#ffffff]">
          Create Game Session
        </h1>

        <div className="mb-4 md:p-0 px-3">
          <label className="text-base block mb-2 font-semibold text-[#E4E2DC]">Total Rounds</label>
          <input
            type="number"
            value={totalHealth}
            onChange={(e) => setTotalHealth(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-md bg-[#2A1F1F] border border-[#D4AF37] text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            min={1}
          />
        </div>

        <div className="mb-6 md:p-0 px-3">
          <label className="block mb-2 text-base font-semibold text-[#E4E2DC]">Pool Amount (zBTC)</label>
          <input
            type="number"
            value={poolAmount}
            onChange={(e) => setPoolAmount(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-md bg-[#2A1F1F] border border-[#D4AF37] text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            step={0.01}
            min={0.1}
          />
        </div>

        <button
          onClick={handleCreateGame}
          disabled={!connected || loading}
          className={`w-full flex justify-center text-2xl pirata-one px-6 py-3 -mt-4 rounded-xl transition duration-300 ease-in-out  ${
            loading || !connected ? 'cursor-not-allowed' : 'text-[#2A1F1F] hover:translate-y-2'
          }`}
        >
          {/* {!connected ? 'Connect Wallet First' : loading ? 'Creating...' : 'Create Session'} */}
          <img src={CreateGame} alt="CreateGame" className="w-52 md:w-52" />
        </button>
      </div>
    </div>
  )
}

export default CreateGameSession

export async function getOrCreateAssociatedTokenAccountWithProvider(
  provider: anchor.AnchorProvider,
  owner: PublicKey,
  mintAddress: PublicKey,
) {
  const associatedTokenAddress = await getAssociatedTokenAddress(mintAddress, owner)

  try {
    return await getAccount(provider.connection, associatedTokenAddress)
  } catch {
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        owner, // payer
        associatedTokenAddress,
        owner,
        mintAddress,
      ),
    )
    transaction.feePayer = owner

    await provider.sendAndConfirm(transaction)
    return await getAccount(provider.connection, associatedTokenAddress)
  }
}
