'use client'
import { useState } from 'react'
import { useAIStore } from '@/store/ai-store'
import { AIProvider } from '@/types/ai'

const PROVIDERS: { id: AIProvider; name: string; short: string; defaultModel: string; color: string }[] = [
  { id: 'anthropic', name: 'Claude (Anthropic)', short: 'Claude', defaultModel: 'claude-opus-4-6',       color: '#d97706' },
  { id: 'openai',    name: 'GPT-4o (OpenAI)',    short: 'GPT-4o', defaultModel: 'gpt-4o',               color: '#10b981' },
  { id: 'gemini',    name: 'Gemini (Google)',     short: 'Gemini', defaultModel: 'gemini-3-flash-preview',color: '#3b82f6' },
  { id: 'grok',      name: 'Grok (xAI)',          short: 'Grok',   defaultModel: 'grok-2',               color: '#ec4899' },
]

export default function AIProviderSelector() {
  const { config, setConfig } = useAIStore()
  const [open, setOpen] = useState(!config)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(config?.provider ?? 'anthropic')
  const [apiKey, setApiKey] = useState(config?.apiKey ?? '')

  const handleSave = () => {
    const provider = PROVIDERS.find((p) => p.id === selectedProvider)!
    setConfig({ provider: selectedProvider, apiKey, model: provider.defaultModel })
    setOpen(false)
  }

  const activeProvider = PROVIDERS.find((p) => p.id === (config?.provider ?? selectedProvider))

  return (
    <div style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
      {/* Top bar — always visible */}
      <div className="flex items-center justify-between px-4 h-11">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--accent)' }}>
            M
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-1)' }}>
            MangaForge
          </span>
        </div>

        {/* Provider status + toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all"
          style={{
            background: open ? 'var(--bg-hover)' : 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-2)'
          }}
        >
          {config ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeProvider?.color ?? 'var(--success)' }} />
              <span style={{ color: 'var(--text-1)' }}>{activeProvider?.short}</span>
              <span style={{ color: 'var(--text-3)' }}>connected</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span>Connect AI</span>
            </>
          )}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Expandable panel */}
      {open && (
        <div className="px-4 pb-4 pt-1">
          {/* Provider chips */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: selectedProvider === p.id ? 'var(--bg-hover)' : 'transparent',
                  border: `1px solid ${selectedProvider === p.id ? p.color + '60' : 'var(--border)'}`,
                  color: selectedProvider === p.id ? p.color : 'var(--text-2)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5 align-middle"
                  style={{ background: p.color }} />
                {p.short}
              </button>
            ))}
          </div>

          {/* API key input + save */}
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key..."
              onKeyDown={(e) => e.key === 'Enter' && apiKey.trim() && handleSave()}
              className="flex-1 px-3 py-2 rounded-md text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
              }}
            />
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Connect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
