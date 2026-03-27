'use client'
import { useEffect, useRef, useCallback } from 'react'
import * as fabric from 'fabric'
import { useCanvasStore } from '@/store/canvas-store'
import { applyOperation } from '@/lib/canvas/layer-manager'
import { CanvasOperation } from '@/types/canvas'

export default function MangaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { canvasState, activeLayer, setApplyOperations } = useCanvasStore()

  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current) return

    const isMobile = window.innerWidth < 640
    const maxW = isMobile ? window.innerWidth - 16 : canvasState.width
    const scale = maxW / canvasState.width
    const w = Math.round(canvasState.width * scale)
    const h = Math.round(canvasState.height * scale)

    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width: w,
      height: h,
      backgroundColor: '#ffffff',
      isDrawingMode: false
    })

    return () => {
      fabricRef.current?.dispose()
      fabricRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stable callback — re-created only when fabricRef changes (effectively never).
  // Registered in the Zustand store so AIPromptInput can read it without
  // relying on window globals or prop drilling.
  const applyOperations = useCallback((operations: CanvasOperation[]) => {
    if (!fabricRef.current) {
      console.warn('[MangaCanvas] applyOperations called before canvas is ready')
      return
    }
    operations.forEach((op) => applyOperation(fabricRef.current!, op))
  }, [])

  useEffect(() => {
    setApplyOperations(applyOperations)
    return () => {
      setApplyOperations(null)
    }
  }, [applyOperations, setApplyOperations])

  return (
    <div ref={wrapperRef} className="relative border border-gray-300 shadow-lg rounded overflow-hidden max-w-full">
      <div className="absolute top-2 left-2 z-10 text-xs text-gray-400 bg-white/70 px-2 py-0.5 rounded">
        Layer: <span className="font-semibold text-purple-600">{activeLayer}</span>
      </div>
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  )
}
