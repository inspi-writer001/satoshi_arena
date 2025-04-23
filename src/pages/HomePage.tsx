import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

import bgImage from '/background/rps_bg_1.jpg'
import LoadingPage from './LoadingPage'
import { useGameStore } from '../store/GameStore'

const HomePage = () => {
  const [loaded, setLoaded] = useState(false)
  const navigate = useNavigate()
  const { publicKey, signMessage } = useWallet()
  const { setTransitionTrigger } = useGameStore()

  const handleNavigate = async (path: string) => {
    try {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet not ready or does not support message signing')
      }

      const message = new TextEncoder().encode(`Welcome to Satoshi's Arena!\nWallet: ${publicKey.toBase58()}`)
      const signature = await signMessage(message)
      console.log('Signed message:', Buffer.from(signature).toString('hex'))

      setTransitionTrigger(true)
      setTimeout(() => navigate(path), 500)
    } catch (error) {
      console.error('Navigation failed:', error)
    }
  }

  return (
    <>
      {loaded ? (
        <div
          className="flex flex-col items-center justify-center h-screen w-screen text-[#E4E2DC] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="flex relative flex-col justify-end w-full h-full pb-12 px-4 text-center bg-black bg-opacity-40">
            <div className="absolute top-10 right-10">
              <WalletMultiButton style={{ background: '#D4AF37' }} />
            </div>

            <div className="space-y-6 md:space-x-6">
              <button
                disabled={!publicKey}
                onClick={() => handleNavigate('/sessions')}
                className={`text-3xl sm:text-4xl md:text-5xl pirata-one border px-8 py-4 rounded-xl transition duration-300 ease-in-out shadow-lg ${
                  publicKey
                    ? 'text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#2A1F1F] hover:shadow-[#D4AF37]/50'
                    : 'text-gray-400 border-gray-400 cursor-not-allowed'
                }`}
              >
                Join Game Session
              </button>

              <button
                disabled={!publicKey}
                onClick={() => handleNavigate('/create-session')}
                className={`text-3xl sm:text-4xl md:text-5xl pirata-one border px-8 py-4 rounded-xl transition duration-300 ease-in-out shadow-lg ${
                  publicKey
                    ? 'text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#2A1F1F] hover:shadow-[#D4AF37]/50'
                    : 'text-gray-400 border-gray-400 cursor-not-allowed'
                }`}
              >
                Create Game Session
              </button>
            </div>
          </div>
        </div>
      ) : (
        <LoadingPage onLoaded={() => setLoaded(true)} />
      )}
    </>
  )
}

export default React.memo(HomePage)
