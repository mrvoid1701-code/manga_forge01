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

export function applyOperation(canvas: fabric.Canvas, operation: CanvasOperation): void {
  switch (operation.op) {
    case 'addPath': {
      const pathData = operation.points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
        .join(' ')
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
