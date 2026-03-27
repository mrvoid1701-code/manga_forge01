'use client'
import { useState, useEffect } from 'react'
import { useCanvasStore } from '@/store/canvas-store'

type ImgProvider = 'replicate' | 'dalle'

const IMG_PROVIDERS: { id: ImgProvider; name: string; note: string; color: string }[] = [
  {
    id: 'replicate',
    name: 'Replicate — Animagine XL',
    note: 'Best manga quality · $0.002/img · ~30s',
    color: '#0ea5e9',
  },
  {
    id: 'dalle',
    name: 'DALL-E 3 (OpenAI)',
    note: 'Uses your OpenAI key · $0.04/img · ~15s',
    color: '#10b981',
  },
]

const STYLE_PRESETS = [
  { label: 'Shonen B&W', suffix: 'black and white manga panel, bold ink lineart, Shonen Jump style' },
  { label: 'Naruto style', suffix: 'Masashi Kishimoto art style, ninja manga, dynamic action pose, ink sketch' },
  { label: 'Bleach style', suffix: 'Tite Kubo art style, shinigami manga, dramatic shading, clean lineart' },
  { label: 'Color Anime', suffix: 'anime cel shading, vibrant colors, clean lineart, studio quality' },
  { label: 'Portrait', suffix: 'manga portrait, close-up face, detailed eyes, soft shading' },
]

export default function ImageGeneratorPanel() {
  const [mounted, setMounted] = useState(false)
  const [provider, setProvider] = useState<ImgProvider>('replicate')
  const [apiKey, setApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const { canvasState, applyImageUrl, setLastPreviewUrl } = useCanvasStore()

  useEffect(() => { setMounted(true) }, [])

  // Timer during generation
  useEffect(() => {
    if (!isGenerating) { setElapsed(0); return }
    const t = setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [isGenerating])

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey.trim() || isGenerating) return
    setIsGenerating(true)
    setError(null)
    setResultUrl(null)

    const fullPrompt = `${prompt.trim()}, ${STYLE_PRESETS[selectedPreset].suffix}`

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          provider,
          apiKey,
          width: canvasState.width,
          height: canvasState.height,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')

      setResultUrl(data.url)

      // Apply to canvas sketch layer
      if (applyImageUrl) {
        await applyImageUrl(data.url, 'sketch')
        // Capture preview
        setTimeout(() => {
          const { getPreviewUrl } = useCanvasStore.getState()
          const url = getPreviewUrl?.()
          if (url) setLastPreviewUrl(url)
        }, 300)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      className="flex flex-col gap-3 p-4"
      style={{ background: 'var(--bg-panel)', borderTop: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            Image Generation
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--accent-glow)' }}
          >
            AI Art
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          Generates real manga art → placed on Sketch layer
        </span>
      </div>

      {/* Provider + API key row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1.5">
          {IMG_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
              style={{
                background: provider === p.id ? 'var(--bg-hover)' : 'transparent',
                border: `1px solid ${provider === p.id ? p.color + '70' : 'var(--border)'}`,
                color: provider === p.id ? p.color : 'var(--text-2)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
              {p.id === 'replicate' ? 'Replicate' : 'DALL-E 3'}
            </button>
          ))}
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={
            provider === 'replicate' ? 'Replicate API key (r8_...)' : 'OpenAI API key (sk-...)'
          }
          className="flex-1 px-3 py-1.5 rounded-md text-xs outline-none transition-all"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-1)',
          }}
        />
      </div>

      {/* Provider note */}
      <p className="text-xs -mt-1" style={{ color: 'var(--text-3)' }}>
        {IMG_PROVIDERS.find((p) => p.id === provider)?.note}
      </p>

      {/* Style presets */}
      <div className="flex flex-wrap gap-1.5">
        {STYLE_PRESETS.map((preset, i) => (
          <button
            key={i}
            onClick={() => setSelectedPreset(i)}
            className="px-2.5 py-1 rounded-md text-xs transition-all"
            style={{
              background: selectedPreset === i ? 'var(--accent)' : 'var(--bg-surface)',
              border: `1px solid ${selectedPreset === i ? 'var(--accent)' : 'var(--border)'}`,
              color: selectedPreset === i ? '#fff' : 'var(--text-2)',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Prompt + generate */}
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder='e.g. "young ninja boy with spiky hair, battle stance"'
          disabled={!mounted || isGenerating}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all disabled:cursor-not-allowed"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-1)',
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={!mounted || isGenerating || !prompt.trim() || !apiKey.trim()}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
            color: '#fff',
            minWidth: '110px',
            justifyContent: 'center',
          }}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {elapsed}s
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1l1.5 4H13l-3.5 2.5 1.3 4L7 9.5 3.2 11.5l1.3-4L1 5h4.5z" fill="currentColor" />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="text-xs px-3 py-2 rounded-md"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Result preview */}
      {resultUrl && !isGenerating && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt="Generated manga"
            className="w-16 h-20 object-contain rounded-md"
            style={{ border: '1px solid var(--border)', background: '#fff' }}
          />
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>
              Generated successfully
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Image placed on Sketch layer · Add lineart on top
            </p>
            <a
              href={resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs mt-1 inline-block"
              style={{ color: 'var(--accent-glow)' }}
            >
              Open full size →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
