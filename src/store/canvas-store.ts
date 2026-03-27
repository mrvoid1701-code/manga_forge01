import { create } from 'zustand'
import { CanvasState, LayerType } from '@/types/canvas'

interface CanvasStore {
  canvasState: CanvasState
  activeLayer: LayerType
  isDrawing: boolean
  setActiveLayer: (layer: LayerType) => void
  setIsDrawing: (drawing: boolean) => void
  updateCanvasState: (state: Partial<CanvasState>) => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  canvasState: {
    width: 800,
    height: 1200,
    objects: [],
    layers: ['background', 'sketch', 'lineart', 'shadows', 'color'],
    activeLayer: 'lineart'
  },
  activeLayer: 'lineart',
  isDrawing: false,
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  updateCanvasState: (state) =>
    set((prev) => ({ canvasState: { ...prev.canvasState, ...state } }))
}))
