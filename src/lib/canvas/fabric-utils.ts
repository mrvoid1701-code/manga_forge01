import { fabric } from 'fabric'
import { CanvasState, CanvasObject, LayerType } from '@/types/canvas'

/**
 * Serializes the current Fabric.js canvas state to our structured CanvasState format.
 * This is what gets sent to the AI as context.
 */
export function serializeCanvas(canvas: fabric.Canvas): Partial<CanvasState> {
  const objects: CanvasObject[] = canvas.getObjects().map((obj: fabric.Object, index: number) => {
    const fabricObj = obj as any
    return {
      id: fabricObj.id ?? `obj-${index}`,
      type: fabricObj.type as CanvasObject['type'],
      layer: (fabricObj.data?.layer ?? 'lineart') as LayerType,
      properties: {
        left: obj.left,
        top: obj.top,
        width: obj.width,
        height: obj.height,
        fill: obj.fill,
        stroke: obj.stroke,
        strokeWidth: obj.strokeWidth,
        opacity: obj.opacity
      }
    }
  })

  return { objects }
}

/**
 * Sets the drawing mode on the canvas and configures the brush.
 */
export function setDrawingMode(
  canvas: fabric.Canvas,
  enabled: boolean,
  strokeColor = '#000000',
  strokeWidth = 2
): void {
  canvas.isDrawingMode = enabled
  if (enabled && canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = strokeColor
    canvas.freeDrawingBrush.width = strokeWidth
  }
}

/**
 * Returns all objects belonging to a specific layer.
 */
export function getLayerObjects(canvas: fabric.Canvas, layer: LayerType): fabric.Object[] {
  return canvas.getObjects().filter((obj: fabric.Object) => (obj as any).data?.layer === layer)
}

/**
 * Sets visibility of all objects in a layer.
 */
export function setLayerVisibility(canvas: fabric.Canvas, layer: LayerType, visible: boolean): void {
  getLayerObjects(canvas, layer).forEach((obj: fabric.Object) => {
    obj.set('visible', visible)
  })
  canvas.renderAll()
}
