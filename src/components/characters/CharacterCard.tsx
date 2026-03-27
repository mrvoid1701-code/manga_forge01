'use client'
import { Character } from '@/types/character'
import { useCharacterStore } from '@/store/character-store'

interface CharacterCardProps {
  character: Character
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const { selectCharacter, deleteCharacter, selectedCharacterId } = useCharacterStore()
  const isSelected = selectedCharacterId === character.id

  return (
    <div
      className={`rounded-lg border p-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-purple-500 bg-purple-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
      }`}
      onClick={() => selectCharacter(isSelected ? null : character.id)}
    >
      {character.thumbnailDataUrl ? (
        <img
          src={character.thumbnailDataUrl}
          alt={character.name}
          className="w-full h-24 object-cover rounded mb-2"
        />
      ) : (
        <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-xs">
          No preview
        </div>
      )}
      <h4 className="font-semibold text-sm text-gray-800 truncate">{character.name}</h4>
      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{character.description}</p>
      <button
        onClick={(e) => {
          e.stopPropagation()
          deleteCharacter(character.id)
        }}
        className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors"
      >
        Delete
      </button>
    </div>
  )
}
