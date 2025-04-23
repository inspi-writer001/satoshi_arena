import { Application, extend } from '@pixi/react'
import { Container, Graphics, Sprite, AnimatedSprite } from 'pixi.js'

import { BunnySprite, IBunnySprite } from './BunnySprite'
import React from 'react'

// extend tells @pixi/react what Pixi.js components are available
extend({
  Container,
  Graphics,
  Sprite,
  AnimatedSprite,
})

const PixiBunny: React.FC<IBunnySprite> = ({ textures, playerMovement }) => {
  return (
    // We'll wrap our components with an <Application> component to provide
    // the Pixi.js Application context
    <Application backgroundAlpha={0}>
      <BunnySprite textures={textures} playerMovement={playerMovement} />
    </Application>
  )
}

export default PixiBunny
