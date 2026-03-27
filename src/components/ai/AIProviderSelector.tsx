'use client'
import { useState } from 'react'
import { useAIStore } from '@/store/ai-store'
import { AIProvider } from '@/types/ai'

const PROVIDERS: { id: AIProvider; name: string; defaultModel: string }[] = [
  { id: 'anthropic', name: 'Claude (Anthropic)', defaultModel: 'claude-opus-4-6' },
  { id: 'openai', name: 'GPT-4o (OpenAI)', defaultModel: 'gpt-4o' },
  { id: 'gemini', name: 'Gemini (Google)', defaultModel: 'gemini-2.0-flash' },
  { id: 'grok', name: 'Grok (xAI)', defaultModel: 'grok-2' }
]

export default function AIProviderSelector() {
  const { config, setConfig } = useAIStore()
  const [open, setOpen] = useState(!config)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    config?.provider ?? 'anthropic'
  )
  const [apiKey, setApiKey] = useState(config?.apiKey ?? '')

  const handleSave = () => {
    const provider = PROVIDERS.find((p) => p.id === selectedProvider)!
    setConfig({ provider: selectedProvider, apiKey, model: provider.defaultModel })
    setOpen(false)
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="text-sm font-semibold text-gray-700">AI Provider</span>
        <span className="flex items-center gap-2">
          {config && (
            <span className="text-xs text-green-600 font-medium">
              {config.provider} ✓
            </span>
          )}
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {/* Expandable body */}
      {open && (
        <div className="px-4 pb-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API key..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
