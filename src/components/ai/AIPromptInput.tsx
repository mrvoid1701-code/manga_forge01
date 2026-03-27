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
      console.log('[AI] Received operations:', opCount, response.operations)

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
      setLastStatus(`${opCount} operatii: ${response.explanation}`)

      // Capture preview after a short delay to let canvas render
      setTimeout(() => {
        const url = getPreviewUrl?.()
        if (url) setLastPreviewUrl(url)
      }, 200)

    } catch (error) {
      console.error('[AI] agent error:', error)
      const msg = error instanceof Error ? error.message : 'Unknown error occurred'
      addMessage({ role: 'assistant', content: `Error: ${msg}` })
      setLastStatus(`Error: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white">

      {/* Preview + ops panel */}
      {(lastPreviewUrl || lastOps) && (
        <div className="border-b border-gray-100 bg-gray-50">
          <div className="flex items-start gap-3 p-3">

            {/* Thumbnail preview */}
            {lastPreviewUrl && (
              <div className="shrink-0">
                <p className="text-xs text-gray-400 mb-1">Preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lastPreviewUrl}
                  alt="Canvas preview"
                  className="w-24 h-32 object-contain border border-gray-200 rounded bg-white shadow-sm"
                />
              </div>
            )}

            {/* Operations JSON */}
            {lastOps && (
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setShowOps((v) => !v)}
                  className="text-xs text-purple-600 font-medium hover:text-purple-800 mb-1 flex items-center gap-1"
                >
                  {showOps ? '▼' : '▶'} {lastOps.length} operatii generate {showOps ? '(ascunde)' : '(vezi JSON)'}
                </button>
                {showOps && (
                  <pre className="text-xs bg-gray-900 text-green-300 rounded p-2 overflow-auto max-h-48 leading-relaxed">
                    {JSON.stringify(lastOps, null, 2)}
                  </pre>
                )}
                {lastStatus && !showOps && (
                  <p className="text-xs text-gray-500 truncate" title={lastStatus}>{lastStatus}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 p-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            config
              ? "Describe what to draw... (e.g., 'Draw a manga character face with large eyes')"
              : 'Configure an AI provider above to start drawing'
          }
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
          disabled={!mounted || isLoading || !config}
        />
        <button
          type="submit"
          disabled={!mounted || isLoading || !config || !prompt.trim()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Drawing...' : 'Draw'}
        </button>
      </form>
    </div>
  )
}
