'use client'
import { useState } from 'react'
import { useAIStore } from '@/store/ai-store'
import { useCanvasStore } from '@/store/canvas-store'
import { runAIAgent } from '@/lib/ai'

export default function AIPromptInput() {
  const [prompt, setPrompt] = useState('')
  const { config, messages, addMessage, isLoading, setLoading } = useAIStore()
  const { canvasState } = useCanvasStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !config || isLoading) return

    const userMessage = { role: 'user' as const, content: prompt }
    addMessage(userMessage)
    setPrompt('')
    setLoading(true)

    try {
      const response = await runAIAgent(config, [...messages, userMessage], canvasState)
      addMessage({ role: 'assistant', content: response.explanation })

      // Apply AI-generated operations to the Fabric.js canvas
      const applyFn = (window as any).__mangaCanvasApply
      if (typeof applyFn === 'function') {
        applyFn(response.operations)
      }
    } catch (error) {
      console.error('AI agent error:', error)
      addMessage({
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white">
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
          disabled={isLoading || !config}
        />
        <button
          type="submit"
          disabled={isLoading || !config || !prompt.trim()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Drawing...' : 'Draw'}
        </button>
      </form>
    </div>
  )
}
