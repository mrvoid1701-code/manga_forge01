'use client'
import { useCanvasStore } from '@/store/canvas-store'
import { LayerType } from '@/types/canvas'
import { LAYER_ORDER } from '@/lib/canvas/layer-manager'

const LAYER_META: Record<LayerType, { label: string; icon: string; desc: string }> = {
  color:      { label: 'Color',      icon: '🎨', desc: 'Fills & palette' },
  shadows:    { label: 'Shadows',    icon: '🌑', desc: 'Shading & depth' },
  lineart:    { label: 'Line Art',   icon: '✏️',  desc: 'Outlines & detail' },
  sketch:     { label: 'Sketch',     icon: '📐', desc: 'Construction lines' },
  background: { label: 'Background', icon: '🖼️', desc: 'Scene backdrop' },
}

export default function LayerPanel({ horizontal = false }: { horizontal?: boolean }) {
  const { activeLayer, setActiveLayer } = useCanvasStore()

  if (horizontal) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto"
        style={{ background: 'var(--bg-panel)', borderTop: '1px solid var(--border)' }}>
        <span className="text-xs font-medium shrink-0 mr-1" style={{ color: 'var(--text-3)' }}>
          LAYER
        </span>
        {[...LAYER_ORDER].reverse().map((layer) => {
          const meta = LAYER_META[layer]
          const isActive = activeLayer === layer
          return (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                background: isActive ? 'var(--accent)' : 'var(--bg-surface)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                color: isActive ? '#fff' : 'var(--text-2)',
              }}
            >
              <span>{meta.icon}</span>
              {meta.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-52 flex flex-col flex-shrink-0"
      style={{ background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-dim)' }}>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>
          Layers
        </span>
      </div>

      {/* Layer list — top to bottom = render order top-to-bottom visually */}
      <div className="flex-1 p-2 space-y-0.5">
        {[...LAYER_ORDER].reverse().map((layer) => {
          const meta = LAYER_META[layer]
          const isActive = activeLayer === layer
          return (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group"
              style={{
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
              }}
            >
              {/* Active indicator */}
              <span
                className="w-0.5 h-6 rounded-full flex-shrink-0 transition-all"
                style={{ background: isActive ? 'var(--accent-glow)' : 'transparent' }}
              />
              <span className="text-base leading-none">{meta.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-medium leading-tight"
                  style={{ color: isActive ? 'var(--text-1)' : 'var(--text-2)' }}>
                  {meta.label}
                </div>
                <div className="text-xs leading-tight mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {meta.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-dim)' }}>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          Active layer receives AI drawing
        </p>
      </div>
    </div>
  )
}
