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
  const { canvasState, activeLayer, setApplyOperations, setGetPreviewUrl, setGetSvgData } = useCanvasStore()

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

  const getPreviewUrl = useCallback((): string | null => {
    if (!fabricRef.current) return null
    return fabricRef.current.toDataURL({ format: 'png', multiplier: 0.4 })
  }, [])

  const getSvgData = useCallback((): string | null => {
    if (!fabricRef.current) return null
    return fabricRef.current.toSVG()
  }, [])

  useEffect(() => {
    setApplyOperations(applyOperations)
    setGetPreviewUrl(getPreviewUrl)
    setGetSvgData(getSvgData)
    return () => {
      setApplyOperations(null)
      setGetPreviewUrl(null)
      setGetSvgData(null)
    }
  }, [applyOperations, setApplyOperations, getPreviewUrl, setGetPreviewUrl, getSvgData, setGetSvgData])

  function handleExportSvg() {
    const svg = getSvgData()
    if (!svg) return
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'manga-drawing.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div ref={wrapperRef} className="relative border border-gray-300 shadow-lg rounded overflow-hidden max-w-full">
      <div className="absolute top-2 left-2 z-10 text-xs text-gray-400 bg-white/70 px-2 py-0.5 rounded">
        Layer: <span className="font-semibold text-purple-600">{activeLayer}</span>
      </div>
      <button
        onClick={handleExportSvg}
        className="absolute top-2 right-2 z-10 text-xs bg-white/80 hover:bg-white border border-gray-300 text-gray-600 px-2 py-0.5 rounded shadow-sm"
        title="Export as SVG (open in Krita / Inkscape)"
      >
        Export SVG
      </button>
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  )
}
