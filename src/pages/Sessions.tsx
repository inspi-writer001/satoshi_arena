import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'

import { getProgram, getProvider, tokenMint as mintAddress } from '@/utils/program'
import { getOrCreateAssociatedTokenAccountWithProvider } from './CreateGameSession'
import { useNavigate } from 'react-router'
import { truncateBetween } from '@/utils/helpers'

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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-white">🎰 Open Game Sessions</h1>
      {loading && <p className="text-white">Loading...</p>}
      {sessions.length === 0 && !loading && <p className="text-gray-400">No open sessions found.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((session, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-xl shadow-md">
            <p className="text-yellow-400 font-bold flex text-wrap">
              ⚔️ Creator: {truncateBetween(session.account.creator.toBase58())}
            </p>{' '}
            {session.account.creator.toBase58() == publicKey?.toBase58() && (
              <span className="text-green-400 font-bold text-wrap inline-flex"> ( ME ) </span>
            )}
            <p className="text-gray-300">
              🏆 Pool Amount: {Number(session.account.poolAmount) / LAMPORTS_PER_SOL} zBTC
            </p>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded mt-3"
              onClick={() => {
                if (session.account.creator.toBase58() != publicKey?.toBase58()) {
                  handleJoinGame(session.publicKey, session.account.creator)
                } else {
                  console.log('You cant join your game')
                  navigate(`/session/${session.publicKey}`)
                }
              }}
            >
              Join Game
            </button>
          </div>
        ))}
      </div>
      <h2 className="text-2xl font-semibold mt-10 mb-4 text-white">🧩 Your Active Sessions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allParticipatedSessions
          .filter(
            (session) =>
              session.account.creator.toBase58() === publicKey?.toBase58() ||
              session.account.player?.toBase58() === publicKey?.toBase58(),
          )
          .map((session, index) => (
            <div key={index} className="bg-zinc-900 p-4 rounded-xl border border-indigo-500 shadow-lg">
              <p className="text-purple-400 font-bold">
                {session.account.creator.toBase58() === publicKey?.toBase58() ? '💰️' : '🏖️'} You are{' '}
                {session.account.creator.toBase58() === publicKey?.toBase58() ? 'the Creator' : 'a Player'}
              </p>
              <p className="text-[#D4AF37]">
                🏆 Pool Amount: {(Number(session.account.poolAmount) * 2) / LAMPORTS_PER_SOL} zBTC
              </p>
              <p className="text-teal-400">Health: {session.account.totalHealth}</p>

              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded mt-3"
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
}

export type PlayerAction = { none: {} } | { rock: {} } | { paper: {} } | { scissors: {} }
