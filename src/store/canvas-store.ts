import { create } from 'zustand'
import { CanvasState, CanvasOperation, LayerType } from '@/types/canvas'

interface CanvasStore {
  canvasState: CanvasState
  activeLayer: LayerType
  isDrawing: boolean
  // Registered by MangaCanvas so AIPromptInput can apply operations
  // without relying on window globals or prop drilling.
  applyOperations: ((ops: CanvasOperation[]) => void) | null
  setActiveLayer: (layer: LayerType) => void
  setIsDrawing: (drawing: boolean) => void
  updateCanvasState: (state: Partial<CanvasState>) => void
  setApplyOperations: (fn: ((ops: CanvasOperation[]) => void) | null) => void
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
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  updateCanvasState: (state) =>
    set((prev) => ({ canvasState: { ...prev.canvasState, ...state } })),
  setApplyOperations: (fn) => set({ applyOperations: fn })
}))
