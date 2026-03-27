import MangaCanvas from '@/components/canvas/MangaCanvas'
import LayerPanel from '@/components/canvas/LayerPanel'
import AIPromptInput from '@/components/ai/AIPromptInput'
import AIProviderSelector from '@/components/ai/AIProviderSelector'

export const metadata = {
  title: 'Canvas — MangaForge'
}

export default function CanvasPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <AIProviderSelector />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <MangaCanvas />
        </main>
        <LayerPanel />
      </div>
      <AIPromptInput />
    </div>
  )
}
