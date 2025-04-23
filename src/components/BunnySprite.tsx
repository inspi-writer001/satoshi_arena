import { Texture, AnimatedSprite } from 'pixi.js'
import React, { useEffect, useRef } from 'react'

export interface IBunnySprite {
  textures: Texture[]
  playerMovement: string
}

export const BunnySprite: React.FC<IBunnySprite> = ({ textures, playerMovement }) => {
  const spriteRef = useRef<AnimatedSprite>(null)
  const prevMovement = useRef<string | null>(null)

  useEffect(() => {
    if (!spriteRef.current || textures.length === 0) return

    const sprite = spriteRef.current

    if (prevMovement.current !== playerMovement) {
      sprite.loop = playerMovement === 'idle'
      sprite.gotoAndPlay(0) // Restart animation
      prevMovement.current = playerMovement

      console.log('✅ Movement changed:', playerMovement)
    }
  }, [playerMovement, textures])

  return (
    <pixiAnimatedSprite
      ref={spriteRef}
      anchor={0.03}
      eventMode={'static'}
      scale={0.6}
      animationSpeed={0.09}
      textures={textures} // ✔️ Ensure the right frames are rendered
      loop={playerMovement !== 'idle'}
      onComplete={() => {
        if (spriteRef.current && playerMovement !== 'idle') {
          spriteRef.current.stop()
        }
      }}
      x={20}
      y={100}
    />
  )
}
