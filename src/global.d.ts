import { PhantomProvider } from '@solana/wallet-adapter-base'

declare global {
  interface Window {
    solana?: PhantomProvider
  }
}
