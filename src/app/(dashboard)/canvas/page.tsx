import MangaCanvas from '@/components/canvas/MangaCanvas'
import LayerPanel from '@/components/canvas/LayerPanel'
import AIPromptInput from '@/components/ai/AIPromptInput'
import AIProviderSelector from '@/components/ai/AIProviderSelector'
import ImageGeneratorPanel from '@/components/ai/ImageGeneratorPanel'

export const metadata = {
  title: 'Canvas — MangaForge'
}

export default function CanvasPage() {
  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: 'var(--bg-base)' }}>
      {/* Top bar — AI provider config */}
      <AIProviderSelector />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Canvas area */}
        <main
          className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto"
          style={{ background: 'var(--bg-base)' }}
        >
          <MangaCanvas />
        </main>

        {/* Desktop layer sidebar */}
        <div className="hidden sm:block">
          <LayerPanel />
        </div>
      </div>

      {/* Mobile layer strip */}
      <div className="sm:hidden">
        <LayerPanel horizontal />
      </div>

      {/* Image Generation panel — real manga-quality AI art */}
      <ImageGeneratorPanel />

      {/* Vector drawing prompt — AI draws via canvas operations */}
      <AIPromptInput />
    </div>
  )
}
