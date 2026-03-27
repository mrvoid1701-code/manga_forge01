'use client'
import { useState, useEffect } from 'react'
import { useAIStore } from '@/store/ai-store'
import { useCanvasStore } from '@/store/canvas-store'
import { runAIAgent } from '@/lib/ai'
import { CanvasOperation } from '@/types/canvas'

export default function AIPromptInput() {
  const [prompt, setPrompt] = useState('')
  const [lastStatus, setLastStatus] = useState<string | null>(null)
  const [lastOps, setLastOps] = useState<CanvasOperation[] | null>(null)
  const [showOps, setShowOps] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { config, messages, addMessage, isLoading, setLoading } = useAIStore()
  const { canvasState, applyOperations, getPreviewUrl, setLastPreviewUrl, lastPreviewUrl } = useCanvasStore()

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !config || isLoading) return

    const userMessage = { role: 'user' as const, content: prompt }
    addMessage(userMessage)
    setPrompt('')
    setLoading(true)
    setLastStatus(null)
    setLastOps(null)
    setLastPreviewUrl(null)

    try {
      const response = await runAIAgent(config, [...messages, userMessage], canvasState)
      addMessage({ role: 'assistant', content: response.explanation })

      const opCount = response.operations?.length ?? 0

      if (!applyOperations) {
        setLastStatus(`Canvas not ready. Operations received: ${opCount}`)
        return
      }

      if (opCount === 0) {
        setLastStatus('AI returned 0 operations — nothing to draw.')
        return
      }

      applyOperations(response.operations)
      setLastOps(response.operations)
      setLastStatus(`${opCount} ops — ${response.explanation}`)

      setTimeout(() => {
        const url = getPreviewUrl?.()
        if (url) setLastPreviewUrl(url)
      }, 200)

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      addMessage({ role: 'assistant', content: `Error: ${msg}` })
      setLastStatus(`Error: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-panel)', borderTop: '1px solid var(--border)' }}>

      {/* Result strip */}
      {(lastPreviewUrl || lastOps) && (
        <div className="px-4 py-2.5 flex items-start gap-3"
          style={{ borderBottom: '1px solid var(--border-dim)' }}>

          {/* Thumbnail */}
          {lastPreviewUrl && (
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lastPreviewUrl}
                alt="Preview"
                className="w-16 h-20 object-contain rounded-md"
                style={{ border: '1px solid var(--border)', background: '#fff' }}
              />
            </div>
          )}

          {/* Stats + ops toggle */}
          {lastOps && (
            <div className="flex-1 min-w-0 pt-0.5">
              <button
                onClick={() => setShowOps((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium mb-1 transition-colors"
                style={{ color: 'var(--accent-glow)' }}
              >
                <span
                  className="w-4 h-4 rounded flex items-center justify-center text-xs"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {showOps ? '▼' : '▶'}
                </span>
                {lastOps.length} operations generated
                <span style={{ color: 'var(--text-3)' }}>· {showOps ? 'hide' : 'view JSON'}</span>
              </button>

              {showOps ? (
                <pre className="text-xs rounded-lg p-2.5 overflow-auto max-h-40 leading-relaxed font-mono"
                  style={{ background: 'var(--bg-base)', color: '#86efac', border: '1px solid var(--border)' }}>
                  {JSON.stringify(lastOps, null, 2)}
                </pre>
              ) : (
                lastStatus && (
                  <p className="text-xs truncate" style={{ color: 'var(--text-2)' }} title={lastStatus}>
                    {lastStatus}
                  </p>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Prompt bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3">
        {/* AI status dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: config ? (isLoading ? '#f59e0b' : '#22c55e') : '#4b5563' }}
          title={config ? (isLoading ? 'Drawing...' : 'Ready') : 'No AI connected'}
        />

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            !mounted || !config
              ? 'Connect an AI provider above to start drawing...'
              : isLoading
              ? 'Drawing in progress...'
              : 'Describe what to draw — e.g. "manga girl with long black hair, happy expression"'
          }
          disabled={!mounted || isLoading || !config}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all disabled:cursor-not-allowed"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-1)',
          }}
        />

        <button
          type="submit"
          disabled={!mounted || isLoading || !config || !prompt.trim()}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ background: 'var(--accent)', color: '#fff', minWidth: '90px', justifyContent: 'center' }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Drawing
            </>
          ) : 'Draw'}
        </button>
      </form>
    </div>
  )
}
