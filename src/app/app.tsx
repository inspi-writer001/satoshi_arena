import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import { SolanaProvider } from '../components/solana/solana-provider'

// import { lazy } from 'react'
import HomePage from '@/pages/HomePage'
import Fighter from '@/pages/Fighter'
import TransitionOverlay from '@/components/TransitionOverlay'
import CreateGameSession from '@/pages/CreateGameSession'
import SessionsPage from '@/pages/Sessions'

export function App() {
  return (
    <SolanaProvider>
      <Router>
        <Routes>
          <Route path="/" Component={() => <HomePage />} />

          <Route path="/create-session" Component={() => <CreateGameSession />} />
          <Route path="/sessions" Component={() => <SessionsPage />} />
          <Route path="/session/:sessionPubKey" Component={() => <Fighter />} />
        </Routes>
      </Router>
      <TransitionOverlay />
    </SolanaProvider>
  )
}
