'use client'
import { useCanvasStore } from '@/store/canvas-store'

type Tool = 'select' | 'draw' | 'eraser' | 'text'

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: 'S' },
  { id: 'draw', label: 'Draw', icon: 'D' },
  { id: 'eraser', label: 'Eraser', icon: 'E' },
  { id: 'text', label: 'Text', icon: 'T' }
]

export default function CanvasToolbar() {
  const { isDrawing, setIsDrawing } = useCanvasStore()

  const handleToolSelect = (tool: Tool) => {
    setIsDrawing(tool === 'draw')
    // Additional tool logic will be handled via the canvas store + MangaCanvas
  }

  return (
    <div className="flex flex-col gap-1 p-2 bg-gray-50 border-r border-gray-200 w-12">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          title={tool.label}
          onClick={() => handleToolSelect(tool.id)}
          className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
            tool.id === 'draw' && isDrawing
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  )
}
