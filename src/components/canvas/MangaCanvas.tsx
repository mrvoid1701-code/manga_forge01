'use client'
import { useEffect, useRef } from 'react'
import * as fabric from 'fabric'
import { useCanvasStore } from '@/store/canvas-store'
import { applyOperation } from '@/lib/canvas/layer-manager'
import { CanvasOperation } from '@/types/canvas'

export default function MangaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { canvasState, activeLayer } = useCanvasStore()

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
    <div ref={wrapperRef} className="relative border border-gray-300 shadow-lg rounded overflow-hidden max-w-full">
      <div className="absolute top-2 left-2 z-10 text-xs text-gray-400 bg-white/70 px-2 py-0.5 rounded">
        Layer: <span className="font-semibold text-purple-600">{activeLayer}</span>
      </div>
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  )
}
