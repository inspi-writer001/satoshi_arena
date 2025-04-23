import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token'
import { useNavigate } from 'react-router-dom'
import * as anchor from '@coral-xyz/anchor'
import { useGameStore } from '../store/GameStore'
import { tokenMint, getProvider, getProgram } from '../utils/program'
import bgImage from '/background/rps_bg_1.jpg'
import { PublicKey, Transaction } from '@solana/web3.js'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

const CreateGameSession = () => {
  const [totalHealth, setTotalHealth] = useState(10)
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
      className="flex items-center justify-center w-full min-h-screen bg-cover bg-center bg-no-repeat text-[#E4E2DC]"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-black bg-opacity-70 p-8 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex justify-end mb-6">
          <WalletMultiButton
            style={{
              background: '#D4AF37',
            }}
          />
        </div>

        <h1 className="text-4xl font-bold text-center mb-6 pirata-one text-[#D4AF37]">Create Game Session</h1>

        <div className="mb-4">
          <label className="block mb-2 text-lg font-semibold text-[#E4E2DC]">Total Health</label>
          <input
            type="number"
            value={totalHealth}
            onChange={(e) => setTotalHealth(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-md bg-[#2A1F1F] border border-[#D4AF37] text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            min={1}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-lg font-semibold text-[#E4E2DC]">Pool Amount (zBTC)</label>
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
          className={`w-full text-2xl pirata-one px-6 py-3 rounded-xl transition duration-300 ease-in-out shadow-lg ${
            loading || !connected
              ? 'bg-gray-600 cursor-not-allowed'
              : 'text-[#2A1F1F] bg-[#D4AF37] hover:bg-[#E4C964] hover:shadow-[#D4AF37]/60'
          }`}
        >
          {!connected ? 'Connect Wallet First' : loading ? 'Creating...' : 'Create Session'}
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
