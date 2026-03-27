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
  | {
      op: 'addShape'
      layer: LayerType
      shape: 'circle' | 'rect'
      x: number
      y: number
      width: number
      height: number
      /** Optional fill color hex string. Defaults to 'transparent' if omitted. */
      fillColor?: string
      /** Optional stroke color hex string. Defaults to '#000000' if omitted. */
      strokeColor?: string
      strokeWidth?: number
    }
  | {
      /**
       * Dedicated filled rectangle operation — preferred over addShape for color fills.
       * The AI should always use this for skin, iris, lip, hair, and background fills.
       */
      op: 'addFilledRect'
      layer: LayerType
      x: number
      y: number
      width: number
      height: number
      fillColor: string
      strokeColor?: string
      strokeWidth?: number
    }
  | { op: 'addText'; layer: LayerType; text: string; x: number; y: number; fontSize: number }
  | { op: 'setFill'; objectId: string; color: string }
  | { op: 'setStroke'; objectId: string; width: number; color: string }
  | { op: 'deleteObject'; objectId: string }
  | { op: 'clearLayer'; layer: LayerType }
  // ── Semantic operations — expanded by semantic-renderer before rendering ──
  | { op: 'drawFace';       cx: number; cy: number; width?: number; height?: number }
  | { op: 'drawEye';        cx: number; cy: number; size?: 'small' | 'medium' | 'large'; emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised'; irisColor?: string }
  | { op: 'drawEyebrow';    cx: number; cy: number; side: 'left' | 'right'; emotion?: string }
  | { op: 'drawNose';       cx: number; cy: number }
  | { op: 'drawMouth';      cx: number; cy: number; emotion?: string; width?: number }
  | { op: 'drawEar';        cx: number; cy: number; side: 'left' | 'right' }
  | { op: 'drawNeck';       cx: number; cy: number; width?: number; height?: number }
  | { op: 'drawHair';       crownX: number; crownY: number; style?: string; color?: string; length?: 'short' | 'medium' | 'long' }
  | { op: 'drawBlush';      cx: number; cy: number; side: 'left' | 'right' }
  | { op: 'drawBackground'; style?: string; color1?: string; color2?: string; width: number; height: number }
