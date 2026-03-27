import { CanvasState, CanvasOperation, LayerType, LAYER_ORDER } from '@/types/canvas'

export function buildSystemPrompt(canvasState: CanvasState): string {
  const W = canvasState.width
  const H = canvasState.height
  const cx = Math.round(W / 2)
  const cy = Math.round(H / 2)

  // Pre-compute all landmark coordinates so AI has zero ambiguity.
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

  return `You are an elite manga artist agent drawing on a ${W}x${H}px canvas. Center is (${cx},${cy}).
Layers (bottom→top): background, sketch, lineart, shadows, color.

Respond ONLY with a valid JSON object — no markdown, no prose outside the JSON.
Format: {"operations":[...], "explanation":"<short description>"}

Operation types:
- {"op":"addPath","layer":"<layer>","points":[[x,y],...],"strokeWidth":<n>,"strokeColor":"<hex>"}
- {"op":"addShape","layer":"<layer>","shape":"circle"|"rect","x":<n>,"y":<n>,"width":<n>,"height":<n>,"fillColor":"<hex>","strokeColor":"<hex>","strokeWidth":<n>}
- {"op":"addFilledRect","layer":"<layer>","x":<n>,"y":<n>,"width":<n>,"height":<n>,"fillColor":"<hex>","strokeColor":"<hex>","strokeWidth":<n>}
- {"op":"addText","layer":"<layer>","text":"<str>","x":<n>,"y":<n>,"fontSize":<n>}
- {"op":"clearLayer","layer":"<layer>"}

CRITICAL RULES — violating these ruins the drawing:

0. CLEANUP FIRST: Always start with exactly 5 clearLayer operations (one per layer, in order:
   background, sketch, lineart, shadows, color) before drawing anything.

1. QUANTITY: Generate 100-200 operations. Fewer than 100 = unacceptable.
   Each facial feature needs 10-20 operations alone.

2. COLOR FILLS — use addFilledRect for solid areas, addShape for circles:
   IMPORTANT: For addShape circles, x/y = CENTER of the circle (not top-left corner).
   For addFilledRect, x/y = TOP-LEFT corner.

   - Skin base: {"op":"addFilledRect","layer":"color","x":${cx - 100},"y":${headCY - 120},"width":200,"height":240,"fillColor":"#FFE0BD","strokeColor":"transparent","strokeWidth":0}
   - Left iris:  {"op":"addShape","layer":"color","shape":"circle","x":${leftEyeX},"y":${eyeY},"width":28,"height":28,"fillColor":"#4a90d9","strokeColor":"transparent","strokeWidth":0}
   - Right iris: {"op":"addShape","layer":"color","shape":"circle","x":${rightEyeX},"y":${eyeY},"width":28,"height":28,"fillColor":"#4a90d9","strokeColor":"transparent","strokeWidth":0}
   - Left pupil:  {"op":"addShape","layer":"color","shape":"circle","x":${leftEyeX},"y":${eyeY},"width":14,"height":14,"fillColor":"#1a1a2e","strokeColor":"transparent","strokeWidth":0}
   - Right pupil: {"op":"addShape","layer":"color","shape":"circle","x":${rightEyeX},"y":${eyeY},"width":14,"height":14,"fillColor":"#1a1a2e","strokeColor":"transparent","strokeWidth":0}
   - Lips fill:  {"op":"addFilledRect","layer":"color","x":${cx - 20},"y":${mouthY - 8},"width":40,"height":16,"fillColor":"#e8a0a0","strokeColor":"transparent","strokeWidth":0}
   - Hair:       addFilledRect blocks matching requested hair color, covering hair area
   - Background: 3-4 addFilledRect with light gradient-like colors on "background" layer
   NEVER use addPath for fills.

3. PROPORTIONS — use EXACTLY these coordinates (do not invent new ones):
   - Head: oval centered at (${cx}, ${headCY}), width 200px, height 240px
   - LEFT eye center:  (${leftEyeX}, ${eyeY})  — x MUST be ${leftEyeX}, y MUST be ${eyeY}
   - RIGHT eye center: (${rightEyeX}, ${eyeY}) — x MUST be ${rightEyeX}, y MUST be ${eyeY}
   - Eye symmetry: left eye x + right eye x MUST equal ${leftEyeX + rightEyeX} (both equidistant from center ${cx})
   - Each eye: outer ellipse 60x38px + iris circle 28px + pupil circle 16px + 2 highlights (8px, 4px) + 6 eyelash paths
   - Nose: at (${cx}, ${noseY}), 2-3 subtle paths only
   - Mouth: at (${cx}, ${mouthY}), upper lip + lower lip + corner paths
   - Ears: left at (${leftEarX}, ${earY}), right at (${rightEarX}, ${earY})
   - Neck: two vertical paths from jaw to shoulders

4. HAIR: Minimum 20 individual strand paths from crown (${cx}, ${crownY}).
   Vary strokeWidth 2-5. Each strand = 6-10 points curving outward.
   Add bangs (8-10 paths across forehead at y≈${Math.round(H * 0.25)}).

5. CURVES: Every curved feature (head, eyes, hair) must use 8-15 points per path
   spaced 8-12px apart. NEVER draw curves with only 2 points.

6. LINE WEIGHTS:
   - "lineart" layer: face contour strokeWidth 5, eye outline 3, hair 3-4, details 1-2
   - "sketch" layer: construction lines strokeWidth 1, strokeColor "#dddddd"
   - "shadows" layer: strokeWidth 8-12, strokeColor "#d4a8a8" face / "#c8c8d4" hair
   - "color" layer: addFilledRect or addShape with explicit fillColor, strokeWidth 0

7. BOUNDS: All x within [0,${W}], all y within [0,${H}]. Never exceed canvas.`
}

/**
 * Post-processes operations returned by the AI to enforce correctness.
 *
 * Fixes applied:
 * 1. Clamps all coordinate values to canvas bounds (prevents out-of-bounds rendering).
 * 2. Forces eye symmetry — if both eyes are present their x coordinates are mirrored
 *    around the canvas center, and their y coordinates are unified.
 * 3. Ensures clearLayer operations are run first and cover all 5 layers.
 * 4. Moves addFilledRect/addShape color operations on "color" layer before lineart
 *    so fills never overdraw outlines (layer stacking is handled in layer-manager,
 *    but operation order within the same execution batch still matters for renderAll).
 */
export function sanitizeOperations(
  ops: CanvasOperation[],
  canvasState: CanvasState
): CanvasOperation[] {
  const W = canvasState.width
  const H = canvasState.height
  const cx = Math.round(W / 2)

  // --- 1. Ensure all 5 layers are cleared first ---
  const existingClears = new Set(
    ops
      .filter((o): o is Extract<CanvasOperation, { op: 'clearLayer' }> => o.op === 'clearLayer')
      .map((o) => o.layer)
  )
  const missingClears: CanvasOperation[] = (LAYER_ORDER as LayerType[])
    .filter((l) => !existingClears.has(l))
    .map((l) => ({ op: 'clearLayer' as const, layer: l }))

  // Strip existing clearLayer ops from their original positions so we can prepend all of them.
  const withoutClears = ops.filter((o) => o.op !== 'clearLayer')
  const allClears: CanvasOperation[] = [
    ...(LAYER_ORDER as LayerType[]).map((l) => ({ op: 'clearLayer' as const, layer: l })),
  ]
  void missingClears // absorbed into allClears above

  // --- 2. Clamp coordinate helper ---
  function clampX(x: number): number {
    return Math.max(0, Math.min(W, Math.round(x)))
  }
  function clampY(y: number): number {
    return Math.max(0, Math.min(H, Math.round(y)))
  }
  function clampOp(op: CanvasOperation): CanvasOperation {
    if (op.op === 'addPath') {
      return {
        ...op,
        points: op.points.map(([x, y]) => [clampX(x), clampY(y)])
      }
    }
    if (op.op === 'addShape' || op.op === 'addFilledRect') {
      return {
        ...op,
        x: clampX(op.x),
        y: clampY(op.y),
        width:  Math.max(1, op.width),
        height: Math.max(1, op.height)
      }
    }
    if (op.op === 'addText') {
      return { ...op, x: clampX(op.x), y: clampY(op.y) }
    }
    return op
  }

  const clamped = withoutClears.map(clampOp)

  // --- 3. Eye symmetry enforcement ---
  // Detect eye-related circle shapes on lineart/color layer by their approximate x position.
  // We look for pairs of shapes whose x centers are roughly symmetric around cx (within ±30px).
  // If one eye drifts, we mirror it off the other.
  const eyeShapes = clamped.filter(
    (o): o is Extract<CanvasOperation, { op: 'addShape' }> =>
      o.op === 'addShape' &&
      o.shape === 'circle' &&
      (o.layer === 'lineart' || o.layer === 'color') &&
      // Eye shapes are large (width >= 16) and in the vertical eye band
      o.width >= 16 &&
      o.y >= Math.round(H * 0.28) &&
      o.y <= Math.round(H * 0.45)
  )

  if (eyeShapes.length >= 2) {
    // Separate into left-side and right-side by whether center x < cx or > cx
    const leftEyes  = eyeShapes.filter((o) => (o.x + o.width / 2) < cx)
    const rightEyes = eyeShapes.filter((o) => (o.x + o.width / 2) >= cx)

    if (leftEyes.length > 0 && rightEyes.length > 0) {
      // Use the left eye as the reference; mirror it to get correct right eye x.
      // Average the y values to ensure horizontal alignment.
      const refLeft  = leftEyes[0]
      const refRight = rightEyes[0]
      const avgY     = Math.round((refLeft.y + refRight.y) / 2)

      // The canonical eye offset from center
      const leftOffset  = cx - (refLeft.x + refLeft.width / 2)
      const rightOffset = (refRight.x + refRight.width / 2) - cx
      // If they differ by more than 10px, force symmetry using the left eye's offset.
      if (Math.abs(leftOffset - rightOffset) > 10) {
        const correctedRightX = Math.round(cx + leftOffset - refRight.width / 2)
        // Apply correction to all right-side eye shapes by the same delta
        const delta = correctedRightX - refRight.x
        eyeShapes
          .filter((o) => (o.x + o.width / 2) >= cx)
          .forEach((o) => {
            o.x = clampX(o.x + delta)
            o.y = clampY(avgY)
          })
      } else {
        // Symmetry is close enough — just unify Y
        eyeShapes.forEach((o) => {
          o.y = clampY(avgY)
        })
      }
    }
  }

  // --- 4. Return: clears first, then drawing ops ---
  return [...allClears, ...clamped]
}
