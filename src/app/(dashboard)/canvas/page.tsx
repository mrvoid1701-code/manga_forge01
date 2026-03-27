import MangaCanvas from '@/components/canvas/MangaCanvas'
import LayerPanel from '@/components/canvas/LayerPanel'
import AIPromptInput from '@/components/ai/AIPromptInput'
import AIProviderSelector from '@/components/ai/AIProviderSelector'

export const metadata = {
  title: 'Canvas — MangaForge'
}

export default function CanvasPage() {
  return (
    <div className="flex flex-col h-[100dvh] bg-gray-100">
      <AIProviderSelector />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <main className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-auto">
          <MangaCanvas />
        </main>
        {/* On desktop: sidebar. On mobile: hidden (layers shown below) */}
        <div className="hidden sm:block">
          <LayerPanel />
        </div>
      </div>
      {/* Mobile layer strip */}
      <div className="sm:hidden">
        <LayerPanel horizontal />
      </div>
      <AIPromptInput />
    </div>
  )
}
