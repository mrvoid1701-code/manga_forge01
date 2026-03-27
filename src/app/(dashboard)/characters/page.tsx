import CharacterSidebar from '@/components/characters/CharacterSidebar'

export const metadata = {
  title: 'Characters — MangaForge'
}

export default function CharactersPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <CharacterSidebar />
      <main className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Character Library</h2>
          <p className="text-gray-400 max-w-sm">
            Select a character from the sidebar to edit their visual attributes, or create a new one
            to get started.
          </p>
        </div>
      </main>
    </div>
  )
}
