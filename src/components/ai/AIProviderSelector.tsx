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
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    config?.provider ?? 'anthropic'
  )
  const [apiKey, setApiKey] = useState(config?.apiKey ?? '')

  const handleSave = () => {
    const provider = PROVIDERS.find((p) => p.id === selectedProvider)!
    setConfig({ provider: selectedProvider, apiKey, model: provider.defaultModel })
  }

  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Provider</h3>
      <div className="flex gap-2 flex-wrap">
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Your API key..."
          className="flex-1 min-w-48 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
      </div>
      {config && (
        <p className="text-xs text-green-600 mt-2">
          Connected: <span className="font-medium">{config.provider}</span> — model:{' '}
          <span className="font-medium">{config.model}</span>
        </p>
      )}
    </div>
  )
}
