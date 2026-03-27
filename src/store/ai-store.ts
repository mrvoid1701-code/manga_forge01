import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AIConfig, AIMessage } from '@/types/ai'

interface AIStore {
  config: AIConfig | null
  messages: AIMessage[]
  isLoading: boolean
  setConfig: (config: AIConfig) => void
  addMessage: (message: AIMessage) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
}

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      config: null,
      messages: [],
      isLoading: false,
      setConfig: (config) => set({ config }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),
      setLoading: (loading) => set({ isLoading: loading })
    }),
    {
      name: 'mangaforge-ai',
      // Only persist the config (API key + provider), not chat history
      partialize: (state) => ({ config: state.config })
    }
  )
)
