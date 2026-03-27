'use client'
import { useCanvasStore } from '@/store/canvas-store'
import { LayerType } from '@/types/canvas'
import { LAYER_ORDER } from '@/lib/canvas/layer-manager'

const LAYER_LABELS: Record<LayerType, string> = {
  background: 'Background',
  sketch: 'Sketch',
  lineart: 'Line Art',
  shadows: 'Shadows',
  color: 'Color'
}

export default function LayerPanel() {
  const { activeLayer, setActiveLayer } = useCanvasStore()

  return (
    <div className="w-48 bg-gray-50 border-l border-gray-200 p-3 flex-shrink-0">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Layers</h3>
      <div className="space-y-1">
        {[...LAYER_ORDER].reverse().map((layer) => (
          <button
            key={layer}
            onClick={() => setActiveLayer(layer)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              activeLayer === layer
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {LAYER_LABELS[layer]}
          </button>
        ))}
      </div>
    </div>
  )
}
