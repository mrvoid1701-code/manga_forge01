'use client'
import { useEffect, useRef } from 'react'
import * as fabric from 'fabric'
import { useCanvasStore } from '@/store/canvas-store'
import { applyOperation } from '@/lib/canvas/layer-manager'
import { CanvasOperation } from '@/types/canvas'

export default function MangaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const { canvasState, activeLayer } = useCanvasStore()

  useEffect(() => {
    if (!canvasRef.current) return

    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width: canvasState.width,
      height: canvasState.height,
      backgroundColor: '#ffffff',
      isDrawingMode: false
    })

    return () => {
      fabricRef.current?.dispose()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyOperations = (operations: CanvasOperation[]) => {
    if (!fabricRef.current) return
    operations.forEach((op) => applyOperation(fabricRef.current!, op))
  }

  // Expose applyOperations via a global for the AI prompt component to call.
  // This avoids prop-drilling through the layout hierarchy.
  useEffect(() => {
    ;(window as any).__mangaCanvasApply = applyOperations
    return () => {
      delete (window as any).__mangaCanvasApply
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative border border-gray-300 shadow-lg rounded overflow-hidden">
      <div className="absolute top-2 left-2 z-10 text-xs text-gray-400 bg-white/70 px-2 py-0.5 rounded">
        Layer: <span className="font-semibold text-purple-600">{activeLayer}</span>
      </div>
      <canvas ref={canvasRef} />
    </div>
  )
}
