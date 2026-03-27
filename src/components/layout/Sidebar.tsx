import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/canvas', label: 'Canvas', icon: 'C' },
  { href: '/characters', label: 'Characters', icon: 'P' }
]

export default function Sidebar() {
  return (
    <aside className="w-14 bg-gray-800 text-white flex flex-col items-center py-4 gap-3 flex-shrink-0">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          title={item.label}
          className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center text-xs font-bold hover:bg-purple-600 transition-colors"
        >
          {item.icon}
        </Link>
      ))}
    </aside>
  )
}
