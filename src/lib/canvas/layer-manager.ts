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
        data: { layer: operation.layer }
      })
      canvas.add(path)
      break
    }
    case 'addShape': {
      const shape =
        operation.shape === 'circle'
          ? new fabric.Circle({
              left: operation.x,
              top: operation.y,
              radius: operation.width / 2,
              fill: 'transparent',
              stroke: '#000',
              data: { layer: operation.layer }
            })
          : new fabric.Rect({
              left: operation.x,
              top: operation.y,
              width: operation.width,
              height: operation.height,
              fill: 'transparent',
              stroke: '#000',
              data: { layer: operation.layer }
            })
      canvas.add(shape)
      break
    }
    case 'addText': {
      const text = new fabric.Text(operation.text, {
        left: operation.x,
        top: operation.y,
        fontSize: operation.fontSize,
        data: { layer: operation.layer }
      })
      canvas.add(text)
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
      const toRemove = canvas
        .getObjects()
        .filter((obj: fabric.Object) => (obj as any).data?.layer === operation.layer)
      toRemove.forEach((obj: fabric.Object) => canvas.remove(obj))
      break
    }
  }
  canvas.renderAll()
}
