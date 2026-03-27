import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Character } from '@/types/character'

interface CharacterStore {
  characters: Character[]
  selectedCharacterId: string | null
  addCharacter: (character: Character) => void
  updateCharacter: (id: string, updates: Partial<Character>) => void
  deleteCharacter: (id: string) => void
  selectCharacter: (id: string | null) => void
  getCharacter: (id: string) => Character | undefined
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      characters: [],
      selectedCharacterId: null,
      addCharacter: (character) =>
        set((state) => ({ characters: [...state.characters, character] })),
      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          )
        })),
      deleteCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          selectedCharacterId:
            state.selectedCharacterId === id ? null : state.selectedCharacterId
        })),
      selectCharacter: (id) => set({ selectedCharacterId: id }),
      getCharacter: (id) => get().characters.find((c) => c.id === id)
    }),
    { name: 'mangaforge-characters' }
  )
)
