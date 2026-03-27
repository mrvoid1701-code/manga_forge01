import * as fabric from 'fabric'
import { LayerType, CanvasOperation } from '@/types/canvas'

export const LAYER_ORDER: LayerType[] = ['background', 'sketch', 'lineart', 'shadows', 'color']

export const LAYER_OPACITY: Record<LayerType, number> = {
  background: 1,
  sketch: 0.3,
  lineart: 1,
  shadows: 0.6,
  color: 0.8
}

/**
 * Z-index base per layer — each layer gets a range of 1000 slots so objects
 * within a layer stay in insertion order while cross-layer stacking is always correct.
 *
 * background: 0–999, sketch: 1000–1999, lineart: 2000–2999,
 * shadows: 3000–3999, color: 4000–4999
 */
// Correct render order: fills below lineart so outlines always show through.
const LAYER_Z_BASE: Record<LayerType, number> = {
  background: 0,
  color: 1000,
  shadows: 2000,
  sketch: 3000,
  lineart: 4000
}

/**
 * Move a newly added object to the correct Z position based on its layer.
 * We push it to the top of its layer band by counting existing same-layer objects.
 */
function enforceLayerOrder(canvas: fabric.Canvas, newObj: fabric.Object): void {
  const layer = (newObj as any).data?.layer as LayerType | undefined
  if (!layer) return

  // Count how many objects of the same layer already exist (excluding the new one)
  const allObjects = canvas.getObjects()
  const sameLayerCount = allObjects.filter(
    (o) => o !== newObj && (o as any).data?.layer === layer
  ).length

  // Desired absolute index = base for this layer + position within the layer
  const desiredIndex = LAYER_Z_BASE[layer] + sameLayerCount

  // Fabric's sendObjectToBack/bringObjectToFront work on the internal array.
  // We use moveTo which takes an absolute index (clamped to array bounds).
  const clampedIndex = Math.min(desiredIndex, allObjects.length - 1)
  canvas.moveObjectTo(newObj, clampedIndex)
}

/**
 * Converts an array of [x, y] points to a smooth SVG path using
 * Catmull-Rom → Cubic Bezier conversion.
 * With only 2 points it falls back to a straight line.
 */
function pointsToCatmullRomPath(points: number[][]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`
  if (points.length === 2) {
    return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`
  }
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0]} ${p2[1]}`
  }
  return d
}

export function applyOperation(canvas: fabric.Canvas, operation: CanvasOperation): void {
  switch (operation.op) {
    case 'addPath': {
      const pathData = pointsToCatmullRomPath(operation.points)
      const path = new fabric.Path(pathData, {
        stroke: operation.strokeColor,
        strokeWidth: operation.strokeWidth,
        fill: 'transparent',
        selectable: false,
        evented: false,
        data: { layer: operation.layer }
      })
      canvas.add(path)
      enforceLayerOrder(canvas, path)
      break
    }

    case 'addShape': {
      // fillColor is now optional — default to transparent for outline-only shapes.
      const fillValue = operation.fillColor ?? 'transparent'
      const strokeValue = operation.strokeColor ?? '#000000'
      const strokeWidthValue = operation.strokeWidth ?? 1

      const shape =
        operation.shape === 'circle'
          ? new fabric.Circle({
              // Use center origin so x/y are the circle center (matching AI expectations)
              left: operation.x,
              top: operation.y,
              originX: 'center',
              originY: 'center',
              radius: operation.width / 2,
              fill: fillValue,
              stroke: strokeValue,
              strokeWidth: strokeWidthValue,
              selectable: false,
              evented: false,
              data: { layer: operation.layer }
            })
          : new fabric.Rect({
              left: operation.x,
              top: operation.y,
              width: operation.width,
              height: operation.height,
              fill: fillValue,
              stroke: strokeValue,
              strokeWidth: strokeWidthValue,
              selectable: false,
              evented: false,
              data: { layer: operation.layer }
            })
      canvas.add(shape)
      enforceLayerOrder(canvas, shape)
      break
    }

    case 'addFilledRect': {
      // Dedicated filled-rect operation — always has a visible fill.
      // Used by AI for skin, iris, lips, hair base, and background blocks.
      const rect = new fabric.Rect({
        left: operation.x,
        top: operation.y,
        width: operation.width,
        height: operation.height,
        fill: operation.fillColor,
        stroke: operation.strokeColor ?? 'transparent',
        strokeWidth: operation.strokeWidth ?? 0,
        selectable: false,
        evented: false,
        data: { layer: operation.layer }
      })
      canvas.add(rect)
      enforceLayerOrder(canvas, rect)
      break
    }

    case 'addText': {
      // fabric.Text is a deprecated alias in v7; FabricText is the canonical class.
      const text = new fabric.FabricText(operation.text, {
        left: operation.x,
        top: operation.y,
        fontSize: operation.fontSize,
        selectable: false,
        evented: false,
        data: { layer: operation.layer }
      })
      canvas.add(text)
      enforceLayerOrder(canvas, text)
      break
    }

    case 'setFill': {
      const obj = canvas.getObjects().find((o: fabric.Object) => (o as any).id === operation.objectId)
      if (obj) {
        obj.set('fill', operation.color)
      }
      break
    }

    case 'setStroke': {
      const obj = canvas.getObjects().find((o: fabric.Object) => (o as any).id === operation.objectId)
      if (obj) {
        obj.set({ stroke: operation.color, strokeWidth: operation.width })
      }
      break
    }

    case 'deleteObject': {
      const obj = canvas.getObjects().find((o: fabric.Object) => (o as any).id === operation.objectId)
      if (obj) canvas.remove(obj)
      break
    }

    case 'clearLayer': {
      // IMPORTANT: Take a snapshot of the objects to remove BEFORE iterating.
      // Mutating canvas.getObjects() in-place while iterating causes Fabric v7
      // to shift indices, resulting in some objects surviving the clear.
      const toRemove = canvas
        .getObjects()
        .filter((obj: fabric.Object) => (obj as any).data?.layer === operation.layer)
        // Spread into a new array so the snapshot is fully decoupled from the live collection.
        .slice()

      toRemove.forEach((obj: fabric.Object) => canvas.remove(obj))
      break
    }
  }

  canvas.renderAll()
}
