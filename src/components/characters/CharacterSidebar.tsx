'use client'
import { useCharacterStore } from '@/store/character-store'
import CharacterCard from './CharacterCard'
import { Character } from '@/types/character'

function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export default function CharacterSidebar() {
  const { characters, addCharacter } = useCharacterStore()

  const handleAddCharacter = () => {
    const newCharacter: Character = {
      id: generateId(),
      name: 'New Character',
      description: 'A new manga character',
      visualAttributes: {
        proportions: 'standard manga (7-8 head heights)',
        facialFeatures: 'large expressive eyes, small nose',
        lineStyle: 'clean, varied stroke weight',
        colorPalette: ['#000000', '#ffffff'],
        hairStyle: 'medium length, dark',
        eyeShape: 'large oval'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    addCharacter(newCharacter)
  }

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Characters</h3>
        <button
          onClick={handleAddCharacter}
          className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {characters.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-4">
            No characters yet. Create one to maintain consistency across frames.
          </p>
        ) : (
          characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))
        )}
      </div>
    </div>
  )
}
