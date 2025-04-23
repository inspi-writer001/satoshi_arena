import { useEffect, useState, FC } from 'react'
import '../styles/landing.css'

interface ILoadingPage {
  onLoaded: () => void
}

const LoadingPage: FC<ILoadingPage> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          onLoaded()
          return 100
        }
        return prev + 1
      })
    }, 30)

    return () => clearInterval(interval)
  }, [onLoaded])

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-gradient-to-b from-[#1c1a1a] to-[#3b2f2f] text-[#e4e2dc]">
      <div className="text-center animate-fade-in">
        <div className="text-5xl font-bold mb-4 cinzel glow text-[#D4AF37]">Satoshi's Arena</div>
        <div className="text-2xl font-medium mb-6 medieval tracking-wider text-[#4d7c4c]">Loading World...</div>

        <div className="relative w-72 h-3 bg-[#2A1F1F] rounded-full mx-auto overflow-hidden shadow-inner">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#4d7c4c] to-[#5fd36a] shimmer"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-sm mt-3 medieval tracking-wide">{progress}%</div>
      </div>
    </div>
  )
}

export default LoadingPage
