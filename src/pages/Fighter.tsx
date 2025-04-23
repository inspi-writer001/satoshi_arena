import { Assets, Texture, Spritesheet, TextureSource } from 'pixi.js'
import PixiBunny from '../components/PixiBunny'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProgram } from '@/utils/program'
import { GameSessionRaw } from './Sessions'
import bgImage from '/background/rps_bg_2.jpg'
import { Progress } from '@/components/Progress'

interface IEntity {
  png: string
  json: string
}

const program = getProgram()

const fetchSession = async (sessionPubKey: string) => {
  const session = await program.account.gameSessionHealth.fetch(sessionPubKey)
  console.log('Session:', session)

  return session
}

const paper_sprite =
  'https://bronze-petite-viper-118.mypinata.cloud/ipfs/bafybeiaqlnrldhrw56guetudt6jdtsrnjmloxem2ixv7hlepdqf7nt5q2a'

const rock_sprite =
  'https://bronze-petite-viper-118.mypinata.cloud/ipfs/bafybeigxwv3hor6lndb5uausjqnk6dypthzb566ato5agl5pt6gkuddrcu'

const scissors_sprite =
  'https://bronze-petite-viper-118.mypinata.cloud/ipfs/bafybeihygd4p4ckyhz7wqyaytq7nna4isoag7pebph2t57xihpdei6moea'

const Fighter = () => {
  // fetch_user function

  const { sessionPubKey } = useParams<{ sessionPubKey: string }>()
  const navigate = useNavigate()
  if (!sessionPubKey) return navigate('/sessions')

  const [isPlayerLoading, setIsPlayerLoading] = useState(true)
  const [playerMovement, setPlayerMovement] = useState<'idle' | 'rock' | 'paper' | 'scissors'>('idle')
  const [enemyMovement, setEnemyMovement] = useState<'idle' | 'rock' | 'paper' | 'scissors'>('paper')

  const [characterTextures, setCharacterTextures] = useState<Texture<TextureSource<any>>[][]>()

  const [enemyTextures, setEnemyTextures] = useState<Texture<TextureSource<any>>[][]>()
  const [gameState, setGameState] = useState<GameSessionRaw>()
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  const getSpriteImage = (
    movement: typeof playerMovement | typeof enemyMovement,
    type: 'player' | 'enemy',
  ): Texture[] => {
    if (!characterTextures || !enemyTextures) {
      console.log('cant find assets')
      return []
    }

    const folder = type === 'player' ? characterTextures : enemyTextures
    if (!folder) {
      console.log('no folders were provided')
      return []
    }

    switch (movement) {
      case 'idle':
        return folder[0] || []
      case 'rock':
        return folder[1] || []
      case 'paper':
        return folder[2] || []
      case 'scissors':
        return folder[3] || []
      default:
        return folder[0] || []
    }
  }

  // ✅ Preload all images to prevent jank

  useEffect(() => {
    fetchSession(sessionPubKey).then((response) => {
      console.log('current session account: ', response)
      setGameState(response as unknown as GameSessionRaw)
      const preloadImages = async (urls: IEntity[]) => {
        const loadSpritesheet = async (entity: IEntity) => {
          try {
            const response = await fetch(entity.json)
            const spritesheetData = await response.json()

            if (!spritesheetData.frames) {
              throw new Error("Invalid spritesheet: 'frames' key missing.")
            }

            console.log('was able to get here')

            const texture = await Assets.load(entity.png)

            const spritesheet = new Spritesheet(texture, spritesheetData)

            await spritesheet.parse()

            const animationTextures = Object.keys(spritesheetData.frames).map(
              (frameName) => spritesheet.textures[frameName],
            )

            if (animationTextures.length === 0) {
              throw new Error('No frames found in spritesheet.')
            }

            return animationTextures
          } catch (error) {
            console.error('Error loading spritesheet:', error)
            return []
          }
        }

        const assetsPromises = urls.map((url) => loadSpritesheet({ json: url.json, png: url.png }))

        return Promise.all(assetsPromises)
      }

      if (response.creator) {
        preloadImages([
          {
            json: rock_sprite + '/spritesheet.json',
            png: rock_sprite + '/spritesheet.png',
          },
          {
            json: paper_sprite + '/spritesheet.json',
            png: paper_sprite + '/spritesheet.png',
          },
          {
            json: scissors_sprite + '/spritesheet.json',
            png: scissors_sprite + '/spritesheet.png',
          },
        ]).then((response) => {
          setCharacterTextures(response)
          setAssetsLoaded(true)
        })
      }

      if (response.player) {
        preloadImages([
          {
            json: rock_sprite + '/spritesheet.json',
            png: rock_sprite + '/spritesheet.png',
          },
          {
            json: paper_sprite + '/spritesheet.json',
            png: paper_sprite + '/spritesheet.png',
          },
          {
            json: scissors_sprite + '/spritesheet.json',
            png: scissors_sprite + '/spritesheet.png',
          },
        ]).then((response) => {
          setEnemyTextures(response)
          setAssetsLoaded(true)
        })
      }
    })
  }, [])
  if (!gameState) {
    return (
      <div className="__loading_screen pirata-one flex w-full h-full text-center justify-center items-center text-2xl p-4">
        Loading...
      </div>
    )
  } else
    return (
      <div
        className="w-full h-full flex justify-center items-center relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        {/* Creator Bars */}
        <div className="absolute top-6 w-full px-10 flex justify-between items-center z-10">
          {/* Player Health */}
          <div className="flex flex-col items-start gap-2">
            <span className="text-xs text-white/80 tracking-widest font-orbitron">PLAYER</span>
            <div className="w-40 bg-white/10 rounded-xl border border-purple-400/30 shadow-sm">
              <Progress
                value={gameState?.account?.creatorHealth || (10 / 10) * 100}
                className="h-3 bg-purple-900/30 [&>*]:bg-purple-400"
              />
            </div>
          </div>

          {/* Player Health */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-white/80 tracking-widest font-orbitron">ENEMY</span>
            <div className="w-40 bg-white/10 rounded-xl border border-red-400/30 shadow-sm">
              <Progress
                value={gameState?.account?.playerHealth || (10 / 10) * 100}
                className="h-3 bg-red-900/30 [&>*]:bg-red-400"
              />
            </div>
          </div>
        </div>

        {/* Fighter Sprites */}
        <div className="w-full h-full max-w-screen-xl px-8 flex justify-between items-end pb-12 z-0">
          <PixiBunny
            key={'player'}
            textures={getSpriteImage(playerMovement, 'player')}
            playerMovement={playerMovement}
          />
          <PixiBunny key={'enemy'} textures={getSpriteImage(enemyMovement, 'enemy')} playerMovement={enemyMovement} />
        </div>
      </div>
    )
}

export default Fighter
