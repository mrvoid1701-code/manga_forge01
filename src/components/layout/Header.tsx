import Link from 'next/link'

export default function Header() {
  return (
    <header className="h-12 bg-gray-900 text-white flex items-center justify-between px-4 flex-shrink-0">
      <Link href="/" className="font-bold text-lg">
        Manga<span className="text-purple-400">Forge</span>
      </Link>
      <nav className="flex gap-4 text-sm">
        <Link href="/canvas" className="hover:text-purple-300 transition-colors">
          Canvas
        </Link>
        <Link href="/characters" className="hover:text-purple-300 transition-colors">
          Characters
        </Link>
      </nav>
    </header>
  )
}
