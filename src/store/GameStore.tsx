import { create } from 'zustand'

interface State {
  globalMusic: boolean
  transitionTrigger: boolean
  setTransitionTrigger: (new_value: boolean) => void
}

const useGameStore = create<State>((set) => ({
  globalMusic: false,
  transitionTrigger: false,
  setTransitionTrigger: (new_value: boolean) => {
    set(() => ({ transitionTrigger: new_value }))
  },
}))

export { useGameStore }
