import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'

import { getProgram, getProvider, tokenMint as mintAddress } from '@/utils/program'
import { getOrCreateAssociatedTokenAccountWithProvider } from './CreateGameSession'
import { useNavigate } from 'react-router'

const program = getProgram()
const provider = getProvider()
// const programID = program.programId
const tokenMint = mintAddress
// const pdaVaultToken = new PublicKey('YOUR_VAULT_TOKEN_PDA') // replace

export default function SessionsPage() {
  const { wallet, publicKey } = useWallet()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<Array<GameSessionRaw>>([])
  const [loading, setLoading] = useState(false)

  const fetchSessions = async () => {
    if (!wallet) return

    const allSessions = await program.account.gameSessionHealth.all()
    const openSessions = allSessions.filter(
      (session) => !session.account.player || Object.keys(session.account.player).length === 0,
    )

    console.log(openSessions)
    setSessions(openSessions as unknown as Array<GameSessionRaw>)
  }

  useEffect(() => {
    fetchSessions()
  }, [wallet])

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
      <h1 className="text-3xl font-bold mb-4 text-white">🧠 Open Game Sessions</h1>
      {loading && <p className="text-white">Loading...</p>}
      {sessions.length === 0 && !loading && <p className="text-gray-400">No open sessions found.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((session, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-xl shadow-md">
            <p className="text-yellow-400 font-bold flex flex-wrap">⚔️ Creator: {session.account.creator.toBase58()}</p>{' '}
            {session.account.creator.toBase58() == publicKey?.toBase58() && (
              <span className="text-green-400 font-bold inline-flex"> ( ME ) </span>
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

export type PlayerAction = { none: {} } | { attack: {} } | { defend: {} } | { heal: {} }
