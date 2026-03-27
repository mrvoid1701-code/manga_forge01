import { create } from 'zustand'
import { CanvasState, CanvasOperation, LayerType } from '@/types/canvas'

interface CanvasStore {
  canvasState: CanvasState
  activeLayer: LayerType
  isDrawing: boolean
  applyOperations: ((ops: CanvasOperation[]) => void) | null
  getPreviewUrl: (() => string | null) | null
  lastPreviewUrl: string | null
  setActiveLayer: (layer: LayerType) => void
  setIsDrawing: (drawing: boolean) => void
  updateCanvasState: (state: Partial<CanvasState>) => void
  setApplyOperations: (fn: ((ops: CanvasOperation[]) => void) | null) => void
  setGetPreviewUrl: (fn: (() => string | null) | null) => void
  setLastPreviewUrl: (url: string | null) => void
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
  applyOperations: null,
  getPreviewUrl: null,
  lastPreviewUrl: null,
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  updateCanvasState: (state) =>
    set((prev) => ({ canvasState: { ...prev.canvasState, ...state } })),
  setApplyOperations: (fn) => set({ applyOperations: fn }),
  setGetPreviewUrl: (fn) => set({ getPreviewUrl: fn }),
  setLastPreviewUrl: (url) => set({ lastPreviewUrl: url })
}))
