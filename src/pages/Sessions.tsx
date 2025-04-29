import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'

import { getProgram, getProvider, tokenMint as mintAddress } from '@/utils/program'
import { getOrCreateAssociatedTokenAccountWithProvider } from './CreateGameSession'
import { useNavigate } from 'react-router'
import { truncateBetween } from '@/utils/helpers'
import bgImage from '/background/ree.jpg'

const program = getProgram()
const provider = getProvider()
// const programID = program.programId
const tokenMint = mintAddress
// const pdaVaultToken = new PublicKey('YOUR_VAULT_TOKEN_PDA') // replace

export default function SessionsPage() {
  const { wallet, publicKey } = useWallet()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<Array<GameSessionRaw>>([])
  const [allParticipatedSessions, setAllParticipatedSessions] = useState<Array<GameSessionRaw>>([])
  const [loading, _setLoading] = useState(false)

  const fetchSessions = async () => {
    if (!wallet || !publicKey) return

    const allSessions = await program.account.gameSessionHealth.all()
    const openSessions = allSessions.filter(
      (session) => !session.account.player || Object.keys(session.account.player).length === 0,
    )
    const userSessions = allSessions.filter(
      (session) =>
        session.account.creator.toBase58() === publicKey.toBase58() ||
        session.account.player?.toBase58() === publicKey.toBase58(),
    )

    console.log(openSessions)
    setSessions(openSessions as unknown as Array<GameSessionRaw>)
    setAllParticipatedSessions(userSessions as unknown as Array<GameSessionRaw>)
  }

  useEffect(() => {
    fetchSessions()
  }, [wallet])

  useEffect(() => {
    if (!wallet || !publicKey) return

    const connection = program.provider.connection
    let listenerId: number

    const listenToGameSessions = async () => {
      listenerId = await connection.onProgramAccountChange(
        program.programId,
        async (keyedAccountInfo) => {
          try {
            const decoded = program.account.gameSessionHealth.coder.accounts.decode(
              'gameSessionHealth',
              keyedAccountInfo.accountInfo.data,
            )

            console.log('🔁 Real-time session update:', decoded)

            fetchSessions()
          } catch (err) {
            console.error('Error decoding session data:', err)
          }
        },
        {
          commitment: 'confirmed',
          encoding: 'base64', // default if omitted; safe for borsh-encoded data
          // Optional filter example:
          // filters: [{ dataSize: 400 }] // You can add this if your accounts are fixed-size
        },
      )
    }

    listenToGameSessions()

    return () => {
      if (listenerId !== undefined) {
        connection.removeProgramAccountChangeListener(listenerId)
      }
    }
  }, [wallet, publicKey])

  const handleJoinGame = async (sessionPubkey: PublicKey, creatorWallet: PublicKey) => {
    if (!wallet || !publicKey || !wallet.adapter.publicKey) return
    try {
      const tokenAccount = await getOrCreateAssociatedTokenAccountWithProvider(provider, publicKey, tokenMint)

      const [pda_state_account, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('satoshi_arena'), creatorWallet.toBuffer()],
        program.programId,
      )

      const [pdaVaultToken, __bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), pda_state_account.toBuffer()],
        program.programId,
      )

      const tx = await program.methods
        .joinGame()
        .accounts({
          playerTokenAccount: tokenAccount.address,
          vaultTokenAccount: pdaVaultToken,
          stateAccount: sessionPubkey,
          player: wallet.adapter.publicKey,
        })
        .rpc()

      console.log('Joined game with tx:', tx)
      navigate(`/session/${sessionPubkey}`)
      fetchSessions()
    } catch (err) {
      console.error('Join game failed:', err)
    }
  }

  return (
    <div
      className="p-6 min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <h1 className="text-3xl font-bold mb-8 text-white">✌️ Open Game Sessions</h1>

      {loading && <p className="text-white">Loading...</p>}
      {sessions.length === 0 && !loading && <p className="text-gray-400">No open sessions found.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session, index) => (
          <div
            key={index}
            className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out"
          >
            <p className="text-yellow-400 font-bold">
              ⚔️ Creator: {truncateBetween(session.account.creator.toBase58())}
              {session.account.creator.toBase58() === publicKey?.toBase58() && (
                <span className="text-green-400 font-bold ml-2">(ME)</span>
              )}
            </p>

            <p className="text-gray-300 mt-2">
              🏆 Pool Amount: {Number(session.account.poolAmount) / LAMPORTS_PER_SOL} zBTC
            </p>

            <button
              className="bg-indigo-500/80 hover:bg-indigo-600 text-white w-full py-2 rounded-xl mt-4 transition"
              onClick={() => {
                if (session.account.creator.toBase58() !== publicKey?.toBase58()) {
                  handleJoinGame(session.publicKey, session.account.creator)
                } else {
                  navigate(`/session/${session.publicKey}`)
                }
              }}
            >
              Join Game
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-6 text-white">✊ Your Active Sessions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allParticipatedSessions
          .filter(
            (session) =>
              session.account.creator.toBase58() === publicKey?.toBase58() ||
              session.account.player?.toBase58() === publicKey?.toBase58(),
          )
          .map((session, index) => (
            <div
              key={index}
              className="backdrop-blur-md bg-white/10 border border-purple-400/30 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out"
            >
              <p className="text-purple-400 font-bold">
                {session.account.creator.toBase58() === publicKey?.toBase58() ? '💰️' : '🏖️'} You are{' '}
                {session.account.creator.toBase58() === publicKey?.toBase58() ? 'the Creator' : 'a Player'}
              </p>

              <p className="text-[#D4AF37] mt-2">
                🏆 Pool Amount: {(Number(session.account.poolAmount) * 2) / LAMPORTS_PER_SOL} zBTC
              </p>

              <p className="text-teal-400 mt-2">Health: {session.account.totalHealth}</p>

              <button
                className="bg-purple-500/80 hover:bg-purple-600 text-white w-full py-2 rounded-xl mt-4 transition"
                onClick={() => navigate(`/session/${session.publicKey}`)}
              >
                Resume Game
              </button>
            </div>
          ))}
      </div>
    </div>
  )
}

export interface GameSessionRaw {
  publicKey: PublicKey
  account: {
    creator: PublicKey
    player: PublicKey | null
    playerCanPlay: boolean
    creatorCanPlay: boolean
    totalHealth: number
    playerHealth: number
    creatorHealth: number
    playerAction: PlayerAction
    creatorAction: PlayerAction
    poolAmount: BigInt // hex string (e.g., "3b9aca00")
  }
}

export interface GameSession {
  creator: PublicKey
  player: PublicKey | null
  playerCanPlay: boolean
  creatorCanPlay: boolean
  totalHealth: number
  playerHealth: number
  creatorHealth: number
  playerAction: PlayerAction
  creatorAction: PlayerAction
  poolAmount: BigInt // hex string (e.g., "3b9aca00")
  winner: PublicKey
  lastTurnTimestamp: BigInt
}

export type PlayerAction = { none: {} } | { rock: {} } | { paper: {} } | { scissors: {} }
