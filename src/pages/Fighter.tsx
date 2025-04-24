import { Assets, Texture, Spritesheet, TextureSource } from 'pixi.js'
import PixiBunny from '../components/PixiBunny'
import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProgram } from '@/utils/program'
import { GameSession } from './Sessions'
import bgImage from '/background/rps_bg_2.jpg'
import { Progress } from '@/components/Progress'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'

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

const Fighter: FC = () => {
  // fetch_user function

  const { sessionPubKey } = useParams<{ sessionPubKey: string }>()
  const navigate = useNavigate()
  if (!sessionPubKey) {
    navigate('/sessions')
    return
  }

  const { wallet, publicKey } = useWallet()

  const [playerMovement, setPlayerMovement] = useState<'idle' | 'rock' | 'paper' | 'scissors'>('idle')
  const [enemyMovement, _setEnemyMovement] = useState<'idle' | 'rock' | 'paper' | 'scissors'>('paper')

  const [characterTextures, setCharacterTextures] = useState<Texture<TextureSource<any>>[][]>()

  const [enemyTextures, setEnemyTextures] = useState<Texture<TextureSource<any>>[][]>()
  const [gameState, setGameState] = useState<GameSession>()
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  const [totalPoolAmount, setTotalPoolAmount] = useState<number>(0)
  const [creatorPool, setCreatorPool] = useState<number>(0)
  const [playerPool, setPlayerPool] = useState<number>(0)

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
        return folder[0] || []
      case 'paper':
        return folder[1] || []
      case 'scissors':
        return folder[2] || []
      default:
        return folder[0] || []
    }
  }

  // ✅ Preload all images to prevent jank

  useEffect(() => {
    fetchSession(sessionPubKey).then((response) => {
      console.log('current session account: ', response)
      setGameState(response as unknown as GameSession)
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

      const total = Number((response.poolAmount * 2) / LAMPORTS_PER_SOL)
      const creator = Number(response.poolAmount / LAMPORTS_PER_SOL || 0)
      const player = Number(response.poolAmount / LAMPORTS_PER_SOL || 0)

      setTotalPoolAmount(total)
      setCreatorPool(creator)
      setPlayerPool(player)

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
  if (!gameState || !assetsLoaded) {
    return <div className="__loading_screen ...">Loading...</div>
  }

  const handlePlayTurn = async (creatorWallet: PublicKey, action: typeof playerMovement) => {
    if (!wallet || !publicKey || !wallet.adapter.publicKey) return
    try {
      const [pda_state_account, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('satoshi_arena'), creatorWallet.toBuffer()],
        program.programId,
      )

      let action_condition

      if (action == 'rock') {
        action_condition = { rock: {} }
      } else if (action == 'paper') {
        action_condition = { paper: {} }
      } else if (action == 'scissors') {
        action_condition = { scissors: {} }
      } else {
        action_condition = { idle: {} }
      }

      const tx = await program.methods
        .playTurn(action_condition) // <-- you can make this dynamic (e.g., { paper: {} })
        .accounts({
          stateAccount: pda_state_account,
          signer: wallet.adapter.publicKey,
        })
        .rpc()

      console.log('Played turn with tx:', tx)
      // Optional: Fetch session state or trigger UI update
      const session = await fetchSession(sessionPubKey)
      setGameState(session)
    } catch (err) {
      console.error('Play turn failed:', err)
    }
  }

  if (!gameState) {
    return (
      <div className="__loading_screen pirata-one flex w-full h-full text-center justify-center items-center text-2xl p-4">
        Loading...
      </div>
    )
  } else
    return (
      <div
        className="w-full h-full flex justify-center  items-center relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute top-0 left-0 w-full px-4 md:px-10 py-4 flex justify-between text-ancient-scroll text-sm font-orbitron z-10">
          <div className="text-left font-bold">
            Total Pool: <span className="text-[#D4AF37]">zBTC{totalPoolAmount.toFixed(2)}</span>
          </div>
          <div className="text-center ">
            {publicKey?.toBase58() === gameState.creator?.toBase58()
              ? `Your Pool Amount: zBTC${creatorPool.toFixed(2)}`
              : `Creator Pool: zBTC${creatorPool.toFixed(2)}`}
          </div>
          <div className="text-right ">
            {publicKey?.toBase58() === gameState.player?.toBase58()
              ? `Your Pool Amount: zBTC${playerPool.toFixed(2)}`
              : `Player Pool: zBTC${playerPool.toFixed(2)}`}
          </div>
        </div>
        {/* Creator Bars */}
        <div className="absolute top-16 md:top-12 w-full  px-4 md:px-10 flex justify-between items-center z-10">
          {/* Player Health */}
          <div className="flex flex-col items-start gap-2">
            <span className="text-xs text-white/80 tracking-widest font-orbitron">PLAYER</span>
            <div className="w-40 bg-white/10 rounded-xl border border-purple-400/30 shadow-sm">
              <Progress
                value={(gameState?.creatorHealth / gameState?.totalHealth) * 100}
                className="h-3 bg-purple-900/30 [&>*]:bg-purple-400"
              />
            </div>
          </div>

          {/* Player Health */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-white/80 tracking-widest font-orbitron">ENEMY</span>
            <div className="w-40 bg-white/10 rounded-xl border border-red-400/30 shadow-sm">
              <Progress
                value={(gameState?.playerHealth / gameState?.totalHealth) * 100}
                className="h-3 bg-red-900/30 [&>*]:bg-red-400"
              />
            </div>
          </div>
        </div>

        {/* Fighter Sprites */}
        <div className="w-full h-full  bg-[rgba(19,17,17,0.6)] max-w-screen-xl px-8 flex flex-col md:flex-row justify-between items-end pb-12 z-0 overflow-hidden">
          {/* mobile view  */}
          <div className="__right_fist w-full md:hidden rotate-180 transform translate-x-[26vw] -mt-20">
            <PixiBunny key={'enemy'} textures={getSpriteImage(enemyMovement, 'enemy')} playerMovement={enemyMovement} />
          </div>

          <div className="__left_fist w-full relative md:hidden -translate-x-[26vw] -mt-36">
            <PixiBunny
              key={'player'}
              textures={getSpriteImage(playerMovement, 'player')}
              playerMovement={playerMovement}
            />
          </div>

          {/* Desktop view */}
          <div className="__left_fist md:w-[40%] w-full hidden md:flex">
            <PixiBunny
              key={'player'}
              textures={getSpriteImage(playerMovement, 'player')}
              playerMovement={playerMovement}
            />
          </div>

          <div className="__right_fist w-[40%] hidden md:flex">
            <PixiBunny key={'enemy'} textures={getSpriteImage(enemyMovement, 'enemy')} playerMovement={enemyMovement} />
          </div>
        </div>

        <div className="absolute bottom-8   left-1/2 transform -translate-x-1/2 flex gap-6 z-10">
          {['rock', 'paper', 'scissors'].map((action) => (
            <button
              key={action}
              onClick={() => {
                setPlayerMovement(action as typeof playerMovement)

                handlePlayTurn(gameState.creator, action as typeof playerMovement)
              }}
              className="uppercase font-orbitron px-6 py-3 rounded-xl border-2 shadow-lg transition-all duration-150 text-[#E4E2DC]
                 bg-[#4d7c4c]/80 hover:bg-[#4d7c4c] border-[#D4AF37] hover:scale-105"
            >
              {action}
            </button>
          ))}
        </div>
        {/* <div className="absolute bottom-8 w-full left-1/2 transform -translate-x-1/2 flex justify-center z-20">
          <button
            key={'Resolve'}
            className="w-[80%] md:max-w-64  uppercase font-orbitron px-6 py-3 rounded-xl border-2 shadow-lg transition-all duration-150 text-[#E4E2DC]
                 bg-[#4d7c4c]/80 hover:bg-[#4d7c4c] border-[#D4AF37] hover:scale-105"
          >
            Resolve
          </button>
        </div> */}
      </div>
    )
}

export default Fighter
