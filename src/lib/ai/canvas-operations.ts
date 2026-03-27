import { CanvasState, CanvasOperation, LayerType, LAYER_ORDER } from '@/types/canvas'
import { selectRelevantRules } from './manga-rules'
import { expandSemanticOps } from '@/lib/canvas/semantic-renderer'

export function buildSystemPrompt(canvasState: CanvasState, userPrompt?: string): string {
  const W = canvasState.width
  const H = canvasState.height
  const cx = Math.round(W / 2)

  const headCY    = Math.round(H * 0.35)
  const leftEyeX  = cx - 55
  const rightEyeX = cx + 55
  const eyeY      = Math.round(H * 0.35)
  const noseY     = Math.round(H * 0.42)
  const mouthY    = Math.round(H * 0.47)
  const earY      = Math.round(H * 0.37)
  const leftEarX  = cx - 100
  const rightEarX = cx + 100
  const crownY    = Math.round(H * 0.18)
  const neckY     = headCY + 120

  return `You are an elite manga artist agent drawing on a ${W}x${H}px canvas. Center is (${cx},${Math.round(H/2)}).
Layers (bottom→top): background, sketch, lineart, shadows, color.

Respond ONLY with a valid JSON object — no markdown, no prose outside the JSON.
Format: {"operations":[...], "explanation":"<short description>"}

═══ SEMANTIC OPERATIONS (preferred — use these for face/body/background) ═══

Each semantic op is one JSON object. The renderer generates all the details automatically.

{"op":"drawFace","cx":${cx},"cy":${headCY}}
  → Draws face oval + skin fill. Optional: "width":200,"height":240

{"op":"drawEye","cx":<n>,"cy":<n>}
  → Draws ONE complete manga eye (iris, pupil, lashes, highlights).
  Optional: "size":"small"|"medium"|"large"  "emotion":"neutral"|"happy"|"sad"|"angry"|"surprised"  "irisColor":"<hex>"

{"op":"drawEyebrow","cx":<n>,"cy":<n>,"side":"left"|"right"}
  → Draws one eyebrow. "side" required. Optional: "emotion":"<string>"

{"op":"drawNose","cx":${cx},"cy":${noseY}}
  → Draws minimal manga nose (shadow suggestion, no full outline).

{"op":"drawMouth","cx":${cx},"cy":${mouthY}}
  → Draws upper + lower lip with fill. Optional: "emotion":"<string>"  "width":44

{"op":"drawEar","cx":<n>,"cy":${earY},"side":"left"|"right"}
  → Draws one ear with inner conch. "side" required.

{"op":"drawNeck","cx":${cx},"cy":${neckY}}
  → Draws neck edges + skin fill. Optional: "width":60  "height":80

{"op":"drawHair","crownX":${cx},"crownY":${crownY}}
  → Draws complete hair (strands, bangs, volume, highlights).
  Optional: "style":"straight"|"wavy"|"spiky"  "color":"<hex>"  "length":"short"|"medium"|"long"

{"op":"drawBlush","cx":<n>,"cy":<n>,"side":"left"|"right"}
  → Draws cheek blush. "side" required.

{"op":"drawBackground","width":${W},"height":${H}}
  → Draws full canvas background. Optional: "style":"gradient"|"screentone"|"sparkle"|"plain"  "color1":"<hex>"  "color2":"<hex>"

═══ EXACT COORDINATES — use these values, do not invent new ones ═══

drawFace:         cx=${cx}, cy=${headCY}
drawEye LEFT:     cx=${leftEyeX}, cy=${eyeY}
drawEye RIGHT:    cx=${rightEyeX}, cy=${eyeY}
drawEyebrow LEFT: cx=${leftEyeX + 5}, cy=${eyeY - 30}, side="left"
drawEyebrow RIGHT:cx=${rightEyeX - 5}, cy=${eyeY - 30}, side="right"
drawNose:         cx=${cx}, cy=${noseY}
drawMouth:        cx=${cx}, cy=${mouthY}
drawEar LEFT:     cx=${leftEarX}, cy=${earY}, side="left"
drawEar RIGHT:    cx=${rightEarX}, cy=${earY}, side="right"
drawNeck:         cx=${cx}, cy=${neckY}
drawHair:         crownX=${cx}, crownY=${crownY}
drawBlush LEFT:   cx=${leftEyeX - 5}, cy=${eyeY + 30}, side="left"
drawBlush RIGHT:  cx=${rightEyeX + 5}, cy=${eyeY + 30}, side="right"
drawBackground:   width=${W}, height=${H}

═══ LOW-LEVEL OPERATIONS (only for custom details not covered above) ═══

{"op":"addPath","layer":"<layer>","points":[[x,y],...],"strokeWidth":<n>,"strokeColor":"<hex>"}
{"op":"addShape","layer":"<layer>","shape":"circle","x":<center_x>,"y":<center_y>,"width":<diameter>,"height":<diameter>,"fillColor":"<hex>","strokeColor":"<hex>","strokeWidth":<n>}
{"op":"addFilledRect","layer":"<layer>","x":<top_left_x>,"y":<top_left_y>,"width":<n>,"height":<n>,"fillColor":"<hex>"}
{"op":"addText","layer":"<layer>","text":"<str>","x":<n>,"y":<n>,"fontSize":<n>}
{"op":"clearLayer","layer":"<layer>"}

═══ RULES ═══

0. CLEANUP FIRST: Start with 5 clearLayer ops (background, sketch, lineart, shadows, color).

1. QUANTITY: A full character uses 10-16 semantic ops. That is sufficient.
   Only add low-level addPath ops for special effects (speed lines, SFX, custom details).

2. LAYER RULE for low-level ops:
   - "lineart": strokeWidth 3-5, color "#0a0a1a"
   - "shadows": strokeWidth 8-12, color "#d4a8a8"
   - "color": addFilledRect/addShape only, explicit fillColor
   - "background": background fills only

3. BOUNDS: All x within [0,${W}], all y within [0,${H}].${userPrompt ? selectRelevantRules(userPrompt) : ''}`
}

/**
 * Post-processes AI operations:
 * 1. Expands semantic ops (drawFace, drawEye, etc.) into basic ops
 * 2. Ensures clearLayer for all 5 layers runs first
 * 3. Clamps coordinates to canvas bounds
 * 4. Enforces eye symmetry
 */
export function sanitizeOperations(
  ops: CanvasOperation[],
  canvasState: CanvasState
): CanvasOperation[] {
  const W = canvasState.width
  const H = canvasState.height
  const cx = Math.round(W / 2)

  // --- 0. Expand semantic ops first ---
  const expanded = expandSemanticOps(ops)

  // --- 1. Ensure all 5 layers are cleared first ---
  const existingClears = new Set(
    expanded
      .filter((o): o is Extract<CanvasOperation, { op: 'clearLayer' }> => o.op === 'clearLayer')
      .map((o) => o.layer)
  )
  const allClears: CanvasOperation[] = (LAYER_ORDER as LayerType[]).map(
    (l) => ({ op: 'clearLayer' as const, layer: l })
  )
  void existingClears  // allClears always covers all 5 layers

  const withoutClears = expanded.filter((o) => o.op !== 'clearLayer')

  // --- 2. Clamp coordinates ---
  function clampX(x: number): number { return Math.max(0, Math.min(W, Math.round(x))) }
  function clampY(y: number): number { return Math.max(0, Math.min(H, Math.round(y))) }

  function clampOp(op: CanvasOperation): CanvasOperation {
    if (op.op === 'addPath') {
      return { ...op, points: op.points.map(([x, y]) => [clampX(x), clampY(y)]) }
    }
    if (op.op === 'addShape' || op.op === 'addFilledRect') {
      const nx = clampX(op.x)
      const ny = clampY(op.y)
      return {
        ...op,
        x: nx, y: ny,
        width:  Math.max(1, Math.min(op.width,  W - nx)),
        height: Math.max(1, Math.min(op.height, H - ny))
      }
    }
    if (op.op === 'addText') {
      return { ...op, x: clampX(op.x), y: clampY(op.y) }
    }
    return op
  }

  const clamped = withoutClears.map(clampOp)

  // --- 3. Eye symmetry enforcement ---
  const eyeShapes = clamped.filter(
    (o): o is Extract<CanvasOperation, { op: 'addShape' }> =>
      o.op === 'addShape' &&
      o.shape === 'circle' &&
      (o.layer === 'lineart' || o.layer === 'color') &&
      o.width >= 16 &&
      o.y >= Math.round(H * 0.28) &&
      o.y <= Math.round(H * 0.45)
  )

  if (eyeShapes.length >= 2) {
    const leftEyes  = eyeShapes.filter((o) => o.x < cx)
    const rightEyes = eyeShapes.filter((o) => o.x >= cx)

    if (leftEyes.length > 0 && rightEyes.length > 0) {
      const refLeft  = leftEyes[0]
      const refRight = rightEyes[0]
      const avgY     = Math.round((refLeft.y + refRight.y) / 2)
      const leftOffset  = cx - refLeft.x
      const rightOffset = refRight.x - cx

      if (Math.abs(leftOffset - rightOffset) > 8) {
        const correctedRightX = cx + leftOffset
        const delta = correctedRightX - refRight.x
        eyeShapes
          .filter((o) => o.x >= cx)
          .forEach((o) => { o.x = clampX(o.x + delta); o.y = clampY(avgY) })
      } else {
        eyeShapes.forEach((o) => { o.y = clampY(avgY) })
      }
    }
  }

  return [...allClears, ...clamped]
}
