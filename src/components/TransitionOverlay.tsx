import { useEffect, useState } from 'react'
import { useGameStore } from '../store/GameStore'

const TransitionOverlay = () => {
  const { transitionTrigger: trigger, setTransitionTrigger: onComplete } = useGameStore()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (trigger) {
      setActive(true)
      // Fade in quickly, wait, then fade out
      const timeout1 = setTimeout(() => {
        setActive(false)
        onComplete && onComplete(false) // sets ttrigger to false
      }, 1000) // adjust timing as needed
      return () => clearTimeout(timeout1)
    }
  }, [trigger, onComplete])

  return (
    <div
      className={`fixed cover__ top-0 left-0 w-full h-full bg-black transition-opacity duration-500 z-50 pointer-events-none ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    ></div>
  )
}

export default TransitionOverlay
