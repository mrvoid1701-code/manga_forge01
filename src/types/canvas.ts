export type LayerType = 'background' | 'sketch' | 'lineart' | 'shadows' | 'color'

export const LAYER_ORDER: LayerType[] = ['background', 'sketch', 'lineart', 'shadows', 'color']

export interface CanvasObject {
  id: string
  type: 'path' | 'circle' | 'rect' | 'text' | 'group'
  layer: LayerType
  properties: Record<string, unknown>
}

export interface CanvasState {
  width: number
  height: number
  objects: CanvasObject[]
  layers: LayerType[]
  activeLayer: LayerType
}

export type CanvasOperation =
  | { op: 'addPath'; layer: LayerType; points: number[][]; strokeWidth: number; strokeColor: string }
  | { op: 'addShape'; layer: LayerType; shape: 'circle' | 'rect'; x: number; y: number; width: number; height: number }
  | { op: 'addText'; layer: LayerType; text: string; x: number; y: number; fontSize: number }
  | { op: 'setFill'; objectId: string; color: string }
  | { op: 'setStroke'; objectId: string; width: number; color: string }
  | { op: 'deleteObject'; objectId: string }
  | { op: 'clearLayer'; layer: LayerType }
