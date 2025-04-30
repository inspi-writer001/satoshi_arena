import { Assets, Texture, Spritesheet, TextureSource } from 'pixi.js'
import PixiBunny from '../components/PixiBunny'
import { FC, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gameStore, getProgram, getProvider, tokenMint, treasury } from '@/utils/program'
import { GameSession } from './Sessions'
import bgImage from '/background/game_fight_scene.png'
import bgVideo from '/background/game_fight_scene.mp4'
import { Progress } from '@/components/Progress'
import { AccountInfo, Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use' // For full-screen confetti
import { getOrCreateAssociatedTokenAccountWithProvider } from './CreateGameSession'
import Zbtc from '@/icons/Zbtc'

interface IEntity {
  png: string
  json: string
}

const program = getProgram()

const fetchSession = async (sessionPubKey: string): Promise<GameSession> => {
  const session = await program.account.gameSessionHealth.fetch(sessionPubKey)
  // console.log('Session:', session)

  return session as GameSession
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

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.3
    }
  }, [])

  const { wallet, publicKey } = useWallet()

  const [playerMovement, setPlayerMovement] = useState<'idle' | 'rock' | 'paper' | 'scissors'>('idle')
  const [enemyMovement, setEnemyMovement] = useState<'idle' | 'rock' | 'paper' | 'scissors'>('idle')

  const [characterTextures, setCharacterTextures] = useState<Texture<TextureSource<any>>[][]>()

  const [enemyTextures, setEnemyTextures] = useState<Texture<TextureSource<any>>[][]>()
  const [gameState, setGameState] = useState<GameSession>()
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  const [totalPoolAmount, setTotalPoolAmount] = useState<number>(0)
  const [creatorPool, setCreatorPool] = useState<number>(0)
  const [playerPool, setPlayerPool] = useState<number>(0)
  const { width, height } = useWindowSize()

  const getSpriteImage = (
    movement: typeof playerMovement | typeof enemyMovement,
    type: 'player' | 'enemy',
  ): Texture[] => {
    if (!characterTextures || !enemyTextures) {
      // console.log('cant find assets')
      return []
    }

    const folder = type === 'player' ? characterTextures : enemyTextures
    if (!folder) {
      // console.log('no folders were provided')
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

  useEffect(() => {
    const connection = program.provider.connection as Connection
    const publicKey = new PublicKey(sessionPubKey)

    const listenToSessionChanges = async () => {
      const id = connection.onAccountChange(publicKey, (updatedAccountInfo: AccountInfo<Buffer>) => {
        try {
          const decoded = program.account.gameSessionHealth.coder.accounts.decode(
            'gameSessionHealth',
            updatedAccountInfo.data,
          )
          // console.log('🔁 Real-time session update:', decoded)
          setGameState(decoded as unknown as GameSession)

          const total = Number((decoded.poolAmount * 2) / LAMPORTS_PER_SOL)
          const creator = Number(decoded.poolAmount / LAMPORTS_PER_SOL || 0)
          const player = Number(decoded.poolAmount / LAMPORTS_PER_SOL || 0)

          setTotalPoolAmount(total)
          setCreatorPool(creator)
          setPlayerPool(player)
          if (decoded.isResolved == true) {
            if (decoded.creator.toBase58() == publicKey.toBase58()) {
              setPlayerMovement(Object.keys(decoded.creatorAction)[0] as typeof playerMovement)
              setEnemyMovement(Object.keys(decoded.playerAction)[0] as typeof enemyMovement)
            } else {
              setEnemyMovement(Object.keys(decoded.creatorAction)[0] as typeof enemyMovement)
              setPlayerMovement(Object.keys(decoded.playerAction)[0] as typeof playerMovement)
            }
          }
        } catch (err) {
          console.error('Error decoding real-time session update:', err)
        }
      })

      return id
    }

    let subscriptionId: number

    listenToSessionChanges().then((id) => {
      subscriptionId = id
    })

    return () => {
      if (subscriptionId !== undefined) {
        connection.removeAccountChangeListener(subscriptionId)
      }
    }
  }, [sessionPubKey])

  // ✅ Preload all images to prevent jank

  useEffect(() => {
    fetchSession(sessionPubKey).then((response) => {
      // console.log('current session account: ', response)
      setGameState(response as unknown as GameSession)
      const preloadImages = async (urls: IEntity[]) => {
        const loadSpritesheet = async (entity: IEntity) => {
          try {
            const response = await fetch(entity.json)
            const spritesheetData = await response.json()

            if (!spritesheetData.frames) {
              throw new Error("Invalid spritesheet: 'frames' key missing.")
            }

            // console.log('was able to get here')

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

      const total = Number((Number(response.poolAmount) * 2) / LAMPORTS_PER_SOL)
      const creator = Number(Number(response.poolAmount) / LAMPORTS_PER_SOL || 0)
      const player = Number(Number(response.poolAmount) / LAMPORTS_PER_SOL || 0)

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
          // setAssetsLoaded(true)
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

  const isWinner = gameState.winner && publicKey?.toBase58() === gameState.winner.toBase58()
  const hasGameEnded = !!gameState.winner

  const handleClaimReward = async (creatorWallet: PublicKey) => {
    if (!wallet || !publicKey || !wallet.adapter.publicKey) return
    try {
      const [pda_state_account, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('satoshi_arena'), creatorWallet.toBuffer()],
        program.programId,
      )

      const player_token_account = await getOrCreateAssociatedTokenAccountWithProvider(
        getProvider(),
        publicKey,
        tokenMint,
      )

      const treasury_token_account = await getOrCreateAssociatedTokenAccountWithProvider(
        getProvider(),
        treasury,
        tokenMint,
      )
      // console.log(treasury.toBase58())
      // console.log(treasury_token_account.address.toBase58())

      await program.methods
        .claimReward()
        .accounts({
          stateAccount: pda_state_account,
          claimerTokenAccount: player_token_account.address,
          treasuryTokenAccount: treasury_token_account.address,
          claimer: publicKey,
          globalState: gameStore,
          tokenMint: tokenMint,
        })
        .rpc()

      // console.log('Resolved turn with tx:', tx)

      const session = await fetchSession(sessionPubKey)
      setGameState(session)
    } catch (err) {
      console.error('Resolve turn failed:', err)
    }
  }

  const handleResolveTurn = async (creatorWallet: PublicKey) => {
    if (!wallet || !publicKey || !wallet.adapter.publicKey) return
    try {
      const [pda_state_account, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('satoshi_arena'), creatorWallet.toBuffer()],
        program.programId,
      )

      await program.methods
        .resolveTurn()
        .accounts({
          stateAccount: pda_state_account,
        })
        .rpc()

      // console.log('Resolved turn with tx:', tx)

      const session = await fetchSession(sessionPubKey)
      setGameState(session)
    } catch (err) {
      console.error('Resolve turn failed:', err)
    }
  }

  const handleForceResolve = async (creatorWallet: PublicKey) => {
    if (!wallet || !publicKey || !wallet.adapter.publicKey) return
    try {
      const [pda_state_account, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('satoshi_arena'), creatorWallet.toBuffer()],
        program.programId,
      )

      await program.methods
        .forceResolveIfTimeout()
        .accounts({
          stateAccount: pda_state_account,
        })
        .rpc()

      // console.log('Resolved turn with tx:', tx)

      const session = await fetchSession(sessionPubKey)
      setGameState(session)
    } catch (err) {
      console.error('Resolve turn failed:', err)
    }
  }

  const handlePlayTurn = async (creatorWallet: PublicKey, action: typeof playerMovement) => {
    if (!wallet || !publicKey || !wallet.adapter.publicKey) return
    await fetchSession(sessionPubKey)

    if (!gameState.creatorCanPlay && !gameState.playerCanPlay) {
      handleResolveTurn(creatorWallet)
    }

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

      await program.methods
        .playTurn(action_condition) // <-- you can make this dynamic (e.g., { paper: {} })
        .accounts({
          stateAccount: pda_state_account,
          signer: wallet.adapter.publicKey,
        })
        .rpc()

      // console.log('Played turn with tx:', tx)
      // Optional: Fetch session state or trigger UI update
      const session = await fetchSession(sessionPubKey)
      setGameState(session)
    } catch (err) {
      console.error('Play turn failed:', err)
    }
  }

  const renderActionButtons = () => {
    if (!wallet || !publicKey || !wallet.adapter.publicKey) return
    const isCreator = gameState.creator?.toBase58() === publicKey?.toBase58()
    const isPlayer = gameState.player?.toBase58() === publicKey?.toBase58()

    if (isCreator && gameState.creatorCanPlay) {
      return renderMoveButtons()
    }

    if (isPlayer && gameState.playerCanPlay) {
      return renderMoveButtons()
    }

    if (!gameState.creatorCanPlay && !gameState.playerCanPlay) {
      return (
        <div className="absolute bottom-8 w-full left-1/2 transform -translate-x-1/2 flex justify-center z-20">
          <button
            onClick={() => {
              handleResolveTurn(gameState.creator)
            }}
            className="w-[80%] md:max-w-64  uppercase font-orbitron px-6 py-3 rounded-xl border-2 shadow-lg 
              transition-all duration-150 text-[#E4E2DC] backdrop-blur-md border-purple-400/30 
             bg-[#4d7c4c]/10 hover:bg-purple-900/30 [&>*]:bg-purple-400 hover:scale-105 hover:shadow-2xl  ease-in-out"
          >
            Resolve
          </button>
        </div>
      )
    }

    if ((isCreator && !gameState.creatorCanPlay) || (isPlayer && !gameState.playerCanPlay)) {
      return renderWaitingForOpponent()
    }

    return null
  }

  const renderWaitingForOpponent = () => {
    if (!wallet || !publicKey || !wallet.adapter.publicKey) return
    const lastTurn = Number(gameState.lastTurnTimestamp) * 1000 // convert to ms
    const now = Date.now()
    const canForceResolve = now - lastTurn > 60 * 1000 // 60 seconds

    return (
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-wrap justify-center items-center gap-4 z-10 font-orbitron text-white">
        <div className="md:text-left text-center">Waiting for opponent to play...</div>
        <button
          onClick={() => handleForceResolve(publicKey)}
          disabled={!canForceResolve}
          className={`uppercase font-orbitron px-6 py-3 rounded-xl border-2 shadow-lg transition-all duration-150 backdrop-blur-md ease-in-out text-nowrap ${
            canForceResolve
              ? 'text-[#E4E2DC] border-purple-400/30 bg-[#4d7c4c]/10 hover:bg-purple-900/30 hover:scale-105 hover:shadow-2xl cursor-pointer'
              : 'text-gray-400 border-gray-500/30 bg-gray-800/30 cursor-not-allowed'
          }`}
        >
          Force Resolve
        </button>
      </div>
    )
  }

  const renderMoveButtons = () => {
    return (
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6 z-10">
        {['rock', 'paper', 'scissors'].map((action) => (
          <button
            key={action}
            onClick={() => {
              // setPlayerMovement(action as typeof playerMovement)
              handlePlayTurn(gameState.creator, action as typeof playerMovement)
            }}
            className="uppercase font-orbitron px-6 py-3 rounded-xl border-2 shadow-lg transition-all duration-150 text-[#E4E2DC] backdrop-blur-md border-purple-400/30 
             bg-[#4d7c4c]/10 hover:bg-purple-900/30 [&>*]:bg-purple-400 hover:scale-105 hover:shadow-2xl  ease-in-out"
          >
            {action}
          </button>
        ))}
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="__loading_screen pirata-one flex w-full h-full text-center justify-center items-center text-2xl p-4">
        Loading...
      </div>
    )
  } else
    return (
      <div className="w-full h-full flex justify-center  items-center relative bg-cover bg-center bg-no-repeat">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          src={bgVideo}
          ref={videoRef}
          autoPlay
          // loop
          muted
          playsInline
          poster={bgImage}
        />
        <div className="absolute top-0 left-0 w-full px-4 md:px-10 py-4 flex justify-between text-ancient-scroll text-sm font-orbitron z-10">
          <div className="text-left font-bold">
            Total Pool:{' '}
            <span className="text-[#D4AF37]">
              zBTC{totalPoolAmount.toFixed(2)} <Zbtc width="15px" />
            </span>
          </div>
          <div className="text-center ">
            {publicKey?.toBase58() === gameState.creator?.toBase58()
              ? `Your Pool Amount:  zBTC${creatorPool.toFixed(2)}`
              : `Creator Pool: zBTC${creatorPool.toFixed(2)}`}{' '}
            <Zbtc width="15px" />
          </div>
          <div className="text-right ">
            {publicKey?.toBase58() === gameState.player?.toBase58()
              ? `Your Pool Amount: zBTC${playerPool.toFixed(2)}`
              : `Player Pool: zBTC${playerPool.toFixed(2)}`}{' '}
            <Zbtc width="15px" />
          </div>
        </div>
        {/* Creator Bars */}
        <div className="absolute top-16 md:top-12 w-full px-4 md:px-10 flex justify-between items-center z-10">
          {/* Your Info */}
          <div className="flex flex-col items-start gap-2">
            <span className="text-xs text-white/80 tracking-widest font-orbitron">YOU</span>
            <div className="w-40 bg-white/10 rounded-xl border border-purple-400/30 shadow-sm">
              <Progress
                value={
                  ((publicKey?.toBase58() === gameState.creator.toBase58()
                    ? gameState.creatorHealth
                    : gameState.playerHealth) /
                    gameState.totalHealth) *
                  100
                }
                className="h-3 bg-purple-900/30 [&>*]:bg-purple-400"
              />
            </div>
          </div>

          {/* Enemy Info */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-white/80 tracking-widest font-orbitron">ENEMY</span>
            <div className="w-40 bg-white/10 rounded-xl border border-red-400/30 shadow-sm">
              <Progress
                value={
                  ((publicKey?.toBase58() === gameState.creator.toBase58()
                    ? gameState.playerHealth
                    : gameState.creatorHealth) /
                    gameState.totalHealth) *
                  100
                }
                className="h-3 bg-red-900/30 [&>*]:bg-red-400"
              />
            </div>
          </div>
        </div>

        {/* Fighter Sprites */}
        <div className="w-full h-full  bg-[rgba(19,17,17,0.6)] max-w-screen-xl px-8 flex flex-col md:flex-row justify-between items-end pb-12 z-0 overflow-hidden">
          {/* mobile view  */}
          <div className="__right_fist w-full md:hidden rotate-180 transform translate-x-[26vw] -mt-20">
            <PixiBunny
              key={'enemy'}
              textures={
                publicKey?.toBase58() == gameState.creator.toBase58()
                  ? getSpriteImage(playerMovement, 'player')
                  : getSpriteImage(enemyMovement, 'enemy')
              }
              playerMovement={publicKey?.toBase58() == gameState.creator.toBase58() ? playerMovement : enemyMovement}
            />
          </div>

          <div className="__left_fist w-full relative md:hidden -translate-x-[26vw] -mt-36">
            <PixiBunny
              key={'player'}
              textures={
                publicKey?.toBase58() == gameState.creator.toBase58()
                  ? getSpriteImage(enemyMovement, 'enemy')
                  : getSpriteImage(playerMovement, 'player')
              }
              playerMovement={publicKey?.toBase58() == gameState.creator.toBase58() ? enemyMovement : playerMovement}
            />
          </div>

          {/* Desktop view */}
          <div className="__left_fist md:w-[40%] w-full hidden md:flex">
            <PixiBunny
              key={'enemy'}
              textures={
                publicKey?.toBase58() == gameState.creator.toBase58()
                  ? getSpriteImage(playerMovement, 'player')
                  : getSpriteImage(enemyMovement, 'enemy')
              }
              playerMovement={publicKey?.toBase58() == gameState.creator.toBase58() ? playerMovement : enemyMovement}
            />
          </div>

          <div className="__right_fist w-[40%] hidden md:flex">
            <PixiBunny
              key={'player'}
              textures={
                publicKey?.toBase58() == gameState.creator.toBase58()
                  ? getSpriteImage(enemyMovement, 'enemy')
                  : getSpriteImage(playerMovement, 'player')
              }
              playerMovement={publicKey?.toBase58() == gameState.creator.toBase58() ? enemyMovement : playerMovement}
            />
          </div>
        </div>

        {renderActionButtons()}
        {hasGameEnded && (
          <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center flex-col space-y-6">
            {isWinner ? (
              <>
                <Confetti width={width} height={height} />
                <h1 className="text-4xl font-bold text-green-400 drop-shadow-lg font-orbitron">🎉 You Win! 🎉</h1>
                <button
                  onClick={() =>
                    handleClaimReward(gameState.creator).then(() => {
                      navigate('/sessions')
                    })
                  } // <- define this function
                  className="px-6 py-3 text-lg font-semibold uppercase rounded-xl border-2 border-green-400 text-green-200 hover:bg-green-600/20 transition-all duration-150"
                >
                  Claim Reward
                </button>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-red-500 drop-shadow-lg font-orbitron">😔 You Lose</h1>
                <button
                  onClick={() => navigate('/sessions')}
                  className="px-6 py-3 text-lg font-semibold uppercase rounded-xl border-2 border-red-400 text-red-200 hover:bg-red-600/20 transition-all duration-150"
                >
                  Exit Game
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )
}

export default Fighter
