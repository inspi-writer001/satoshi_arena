import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import CreateGame from '/action_buttons/CreateGame.png'
import JoinGame from '/action_buttons/JoinGame.png'

import bgImage from '/background/ree.jpg'
import bgVideo from '/background/ree.mp4'
// import bgImage from '/background/rps_bg_1.jpg'
import LoadingPage from './LoadingPage'
import { useGameStore } from '../store/GameStore'

const HomePage = () => {
  const [loaded, setLoaded] = useState(false)
  const navigate = useNavigate()
  const { publicKey, signMessage } = useWallet()
  const { setTransitionTrigger } = useGameStore()

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.3
    }
  }, [])

  const handleOnPlaying = () => {
    if (videoRef.current) {
      console.log('Video is playing')
    }
  }

  const handleOnLoadedData = () => {
    // When video is loaded, set playback rate and play after delay
    const video = videoRef.current
    if (video) {
      video.playbackRate = 0.3 // Set playback rate
      setTimeout(() => {
        video
          .play()
          .then(() => {
            console.log('Video started')
          })
          .catch((err) => {
            console.error('Video failed to play:', err)
          })
      }, 3000) // Wait for 3 seconds before playing
    }
  }

  const handleNavigate = async (path: string) => {
    try {
      if (!publicKey) {
        throw new Error('Wallet not connected')
      }

      const key = `isMessageSigned:${publicKey.toBase58()}`
      const lastSigned = localStorage.getItem(key)

      if (lastSigned) {
        const signedAt = new Date(parseInt(lastSigned))
        const now = new Date()

        // If less than 24 hours ago, skip signing
        if (now.getTime() - signedAt.getTime() < 24 * 60 * 60 * 1000) {
          setTransitionTrigger(true)
          setTimeout(() => navigate(path), 500)
          return
        }
      }

      if (!signMessage) {
        throw new Error('Wallet does not support message signing')
      }

      const message = new TextEncoder().encode(`Welcome to Satoshi's Arena!\nWallet: ${publicKey.toBase58()}`)
      await signMessage(message)

      // console.log('Signed message:', Buffer.from(signature).toString('hex'))

      // Save timestamp
      localStorage.setItem(key, Date.now().toString())

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
          <video
            className="absolute top-0 left-0 w-full h-full object-cover"
            src={bgVideo}
            ref={videoRef}
            // autoPlay
            // loop
            muted
            playsInline
            poster={bgImage}
            onPlaying={handleOnPlaying}
            onLoadedData={handleOnLoadedData}
          />
          <div className="flex relative flex-col justify-end w-full h-full pb-12 px-4 text-center bg-black bg-opacity-40">
            <div className="absolute top-10 right-10">
              <WalletMultiButton style={{ background: '#D4AF37' }} />
            </div>

            <div className="space-y-2 md:space-x-6">
              <button
                disabled={!publicKey}
                onClick={() => handleNavigate('/sessions')}
                className={`rounded-xl transition duration-300 ease-in-out shadow-lg ${
                  publicKey
                    ? 'text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#2A1F1F] hover:shadow-[#D4AF37]/50'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <img src={JoinGame} alt="JoinGame" className="w-52 md:w-60" />
              </button>

              <button
                disabled={!publicKey}
                onClick={() => handleNavigate('/create-session')}
                className={`rounded-xl transition duration-300 ease-in-out shadow-lg ${
                  publicKey
                    ? 'text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#2A1F1F] hover:shadow-[#D4AF37]/50'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <img src={CreateGame} alt="CreateGame" className="w-52 md:w-60" />
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
