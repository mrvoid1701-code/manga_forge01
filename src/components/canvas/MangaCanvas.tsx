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
    <div className="flex flex-col items-center gap-3">
      {/* Canvas wrapper */}
      <div
        ref={wrapperRef}
        className="relative rounded-xl overflow-hidden canvas-glow"
        style={{ background: '#fff' }}
      >
        {/* Layer badge */}
        <div
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium backdrop-blur-sm"
          style={{ background: 'rgba(13,13,18,0.75)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-glow)' }} />
          {activeLayer}
        </div>

        {/* Export SVG button */}
        <button
          onClick={handleExportSvg}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all backdrop-blur-sm"
          style={{
            background: 'rgba(13,13,18,0.75)',
            color: 'var(--text-2)',
            border: '1px solid var(--border)',
          }}
          title="Export as SVG — open in Krita or Inkscape"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v7M2.5 5.5l3 3 3-3M1 9.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          SVG
        </button>

        <canvas ref={canvasRef} className="block max-w-full" />
      </div>

      {/* Canvas size label */}
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
        {canvasState.width} × {canvasState.height} px
      </p>
    </div>
  )
}
