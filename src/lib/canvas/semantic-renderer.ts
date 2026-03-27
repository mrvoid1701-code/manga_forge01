/**
 * Semantic Renderer — expands high-level manga semantic operations into
 * low-level CanvasOperation arrays (addPath, addShape, addFilledRect).
 *
 * The AI describes WHAT to draw (drawEye, drawHair, etc.) with just a few
 * parameters. This renderer owns all the coordinate math and generates
 * precise manga-quality geometry internally.
 */

import { CanvasOperation, LayerType } from '@/types/canvas'

type Path    = Extract<CanvasOperation, { op: 'addPath' }>
type Shape   = Extract<CanvasOperation, { op: 'addShape' }>
type FRect   = Extract<CanvasOperation, { op: 'addFilledRect' }>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function path(layer: LayerType, pts: number[][], sw: number, sc: string): Path {
  return { op: 'addPath', layer, points: pts, strokeWidth: sw, strokeColor: sc }
}

function circle(layer: LayerType, cx: number, cy: number, r: number, fill: string): Shape {
  return {
    op: 'addShape', layer, shape: 'circle',
    x: Math.round(cx), y: Math.round(cy),
    width: Math.round(r * 2), height: Math.round(r * 2),
    fillColor: fill, strokeColor: 'transparent', strokeWidth: 0
  }
}

function frect(layer: LayerType, x: number, y: number, w: number, h: number, fill: string): FRect {
  return {
    op: 'addFilledRect', layer,
    x: Math.round(x), y: Math.round(y),
    width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)),
    fillColor: fill, strokeColor: 'transparent', strokeWidth: 0
  }
}

function pt(x: number, y: number): number[] { return [Math.round(x), Math.round(y)] }

// ─── drawFace ─────────────────────────────────────────────────────────────────

type FaceOp = Extract<CanvasOperation, { op: 'drawFace' }>

function expandFace(op: FaceOp): CanvasOperation[] {
  const { cx, cy, width = 200, height = 240 } = op
  const hw = width / 2
  const hh = height / 2
  const ops: CanvasOperation[] = []

  // Skin fill
  ops.push(frect('color', cx - hw, cy - hh * 0.9, width, height * 1.0, '#FFE0BD'))

  // Face outline — 13 points, manga oval with pointed chin
  const outline = [
    pt(cx,            cy - hh * 0.88),
    pt(cx + hw * 0.55, cy - hh * 0.80),
    pt(cx + hw * 0.90, cy - hh * 0.40),
    pt(cx + hw * 1.00, cy + hh * 0.05),
    pt(cx + hw * 0.82, cy + hh * 0.45),
    pt(cx + hw * 0.30, cy + hh * 0.88),
    pt(cx,             cy + hh * 1.00),
    pt(cx - hw * 0.30, cy + hh * 0.88),
    pt(cx - hw * 0.82, cy + hh * 0.45),
    pt(cx - hw * 1.00, cy + hh * 0.05),
    pt(cx - hw * 0.90, cy - hh * 0.40),
    pt(cx - hw * 0.55, cy - hh * 0.80),
    pt(cx,             cy - hh * 0.88),  // close
  ]
  ops.push(path('lineart', outline, 4, '#0a0a1a'))

  // Jaw shadow (subtle, shadows layer)
  ops.push(path('shadows', [
    pt(cx - hw * 0.82, cy + hh * 0.45),
    pt(cx - hw * 0.50, cy + hh * 0.72),
    pt(cx - hw * 0.15, cy + hh * 0.92),
    pt(cx,             cy + hh * 1.00),
  ], 9, '#d4a8a8'))

  return ops
}

// ─── drawEye ──────────────────────────────────────────────────────────────────

type EyeOp = Extract<CanvasOperation, { op: 'drawEye' }>

function expandEye(op: EyeOp): CanvasOperation[] {
  const { cx, cy, size = 'medium', emotion = 'neutral', irisColor = '#4a90d9' } = op
  const S = size === 'small' ? 0.75 : size === 'large' ? 1.25 : 1.0
  const W = 30 * S  // half-width
  const ops: CanvasOperation[] = []

  // Emotion offsets
  let lidApexY   = cy - 19 * S
  let outerCornerY = cy + 4 * S
  let lowerDepthY  = cy + 13 * S

  if (emotion === 'happy') {
    lidApexY = cy - 14 * S; outerCornerY = cy + 7 * S; lowerDepthY = cy + 8 * S
  } else if (emotion === 'sad') {
    lidApexY = cy - 16 * S; outerCornerY = cy + 8 * S; lowerDepthY = cy + 15 * S
  } else if (emotion === 'angry') {
    lidApexY = cy - 22 * S; outerCornerY = cy - 2 * S; lowerDepthY = cy + 8 * S
  } else if (emotion === 'surprised') {
    lidApexY = cy - 24 * S; outerCornerY = cy + 2 * S; lowerDepthY = cy + 16 * S
  }

  // ── Color layer fills ──
  // Iris
  ops.push(circle('color', cx, cy, 14 * S, irisColor))
  // Pupil (slightly off-center)
  ops.push(circle('color', cx + 1 * S, cy + 1 * S, 7 * S, '#1a1a2e'))
  // Large highlight
  ops.push(circle('color', cx - 7 * S, cy - 7 * S, 4 * S, '#ffffff'))
  // Small highlight
  ops.push(circle('color', cx + 8 * S, cy + 4 * S, 2.5 * S, '#ffffff'))

  // ── Shadows layer — iris crescent shadow ──
  ops.push(path('shadows', [
    pt(cx - 11 * S, cy - 12 * S),
    pt(cx - 4 * S,  cy - 14 * S),
    pt(cx + 4 * S,  cy - 14 * S),
    pt(cx + 11 * S, cy - 12 * S),
  ], 6, '#1a1a2e'))

  // ── Lineart — upper eyelid (thick) ──
  const innerCornerX = cx - W
  const outerCornerX = cx + W

  const upperLidThick = [
    pt(innerCornerX,      cy),
    pt(cx - W * 0.72,     cy - 12 * S),
    pt(cx - W * 0.33,     lidApexY - 2 * S),
    pt(cx,                lidApexY),
    pt(cx + W * 0.33,     lidApexY - 1 * S),
    pt(cx + W * 0.60,     cy - 10 * S),
    pt(outerCornerX,      outerCornerY),
    pt(cx + W * 1.1,      outerCornerY - 3 * S),  // lash tail extension
  ]
  ops.push(path('lineart', upperLidThick, 5, '#0a0a1a'))

  // ── Lineart — upper eyelid fine outline ──
  const upperLid = [
    pt(innerCornerX,      cy),
    pt(cx - W * 0.72,     cy - 10 * S),
    pt(cx - W * 0.33,     lidApexY),
    pt(cx,                lidApexY - 1 * S),
    pt(cx + W * 0.33,     lidApexY),
    pt(cx + W * 0.60,     cy - 8 * S),
    pt(outerCornerX,      outerCornerY),
  ]
  ops.push(path('lineart', upperLid, 2, '#0a0a1a'))

  // ── Lineart — lower eyelid ──
  const lowerLid = [
    pt(innerCornerX,    cy),
    pt(cx - W * 0.65,   lowerDepthY * 0.6 + cy * 0.4),
    pt(cx - W * 0.15,   lowerDepthY),
    pt(cx + W * 0.25,   lowerDepthY),
    pt(cx + W * 0.60,   lowerDepthY * 0.7 + cy * 0.3),
    pt(outerCornerX,    outerCornerY),
  ]
  ops.push(path('lineart', lowerLid, 2, '#0a0a1a'))

  // ── Lineart — upper lashes (6 strokes) ──
  const lashBaseXOffsets = [-22, -12, -2, 8, 17, 24]
  const lashBaseYOffsets = [-12, -17, -19, -18, -14, -9]
  const lashDX = [-4, -2, 0, 2, 5, 8]
  const lashDY = [11, 13, 14, 13, 11, 9]
  const lashWidths = [2, 2.5, 2.5, 2.5, 2, 2]

  for (let i = 0; i < 6; i++) {
    const bx = cx + lashBaseXOffsets[i] * S
    const by = cy + lashBaseYOffsets[i] * S
    const ex = bx + lashDX[i] * S
    const ey = by - lashDY[i] * S
    ops.push(path('lineart', [
      pt(bx, by),
      pt((bx + ex) / 2, (by + ey) / 2 - 2 * S),
      pt(ex, ey),
    ], lashWidths[i], '#0a0a1a'))
  }

  // ── Lineart — lower lashes (4 short strokes) ──
  const lowerLashX = [-20, -6, 8, 20]
  for (let i = 0; i < 4; i++) {
    const bx = cx + lowerLashX[i] * S
    const by = lowerDepthY
    ops.push(path('lineart', [
      pt(bx, by),
      pt(bx + lowerLashX[i] * 0.1 * S, by + 5 * S),
    ], 1.5, '#1a1a2e'))
  }

  // ── Inner corner detail ──
  ops.push(path('lineart', [
    pt(innerCornerX + 4 * S, cy - 4 * S),
    pt(innerCornerX,         cy),
    pt(innerCornerX + 4 * S, cy + 4 * S),
  ], 1.5, '#1a1a2e'))

  return ops
}

// ─── drawEyebrow ──────────────────────────────────────────────────────────────

type EyebrowOp = Extract<CanvasOperation, { op: 'drawEyebrow' }>

function expandEyebrow(op: EyebrowOp): CanvasOperation[] {
  const { cx, cy, side, emotion = 'neutral' } = op
  const dir = side === 'right' ? 1 : -1
  const ops: CanvasOperation[] = []

  // Base brow shape — 5 points, mirrored by `dir`
  let pts = [
    pt(cx + dir * (-20), cy),
    pt(cx + dir * (-8),  cy - 7),
    pt(cx + dir * (4),   cy - 10),
    pt(cx + dir * (14),  cy - 8),
    pt(cx + dir * (22),  cy - 3),
  ]

  // Emotion adjustments
  if (emotion === 'angry') {
    pts = pts.map((p, i) => {
      const dy = i === 0 ? 8 : -6  // inner end drops, rest rise
      return pt(p[0], p[1] + dy)
    })
  } else if (emotion === 'sad') {
    pts = pts.map((p, i) => {
      const dy = i <= 1 ? -6 : 4
      return pt(p[0], p[1] + dy)
    })
  } else if (emotion === 'surprised') {
    pts = pts.map((p) => pt(p[0], p[1] - 10))
  } else if (emotion === 'happy') {
    pts = pts.map((p, i) => pt(p[0], p[1] + (i <= 1 ? -4 : 0)))
  }

  // Thick base stroke
  ops.push(path('lineart', pts, 5, '#0a0a1a'))
  // Thin detail stroke on top (slightly offset)
  ops.push(path('lineart', pts.map(([x, y]) => pt(x, y + 2)), 2, '#2a1a0a'))

  return ops
}

// ─── drawNose ─────────────────────────────────────────────────────────────────

type NoseOp = Extract<CanvasOperation, { op: 'drawNose' }>

function expandNose(op: NoseOp): CanvasOperation[] {
  const { cx, cy } = op
  return [
    // Left nostril shadow hint
    path('shadows', [pt(cx - 8, cy + 2), pt(cx - 11, cy + 8), pt(cx - 7, cy + 11)], 2, '#c08080'),
    // Right nostril shadow hint
    path('shadows', [pt(cx + 8, cy + 2), pt(cx + 11, cy + 8), pt(cx + 7, cy + 11)], 2, '#c08080'),
    // Nose tip shadow
    path('shadows', [pt(cx - 5, cy + 9), pt(cx, cy + 12), pt(cx + 5, cy + 9)], 3, '#d4a8a8'),
  ]
}

// ─── drawMouth ────────────────────────────────────────────────────────────────

type MouthOp = Extract<CanvasOperation, { op: 'drawMouth' }>

function expandMouth(op: MouthOp): CanvasOperation[] {
  const { cx, cy, emotion = 'neutral', width = 44 } = op
  const hw = width / 2
  const ops: CanvasOperation[] = []

  if (emotion === 'surprised') {
    // O-shape
    ops.push(frect('color', cx - hw * 0.5, cy - 6, hw, 16, '#e8a0a0'))
    ops.push(circle('lineart', cx, cy + 2, hw * 0.55, 'transparent'))
    const oOps = expandEye({ op: 'drawEye', cx, cy: cy + 2, size: 'small', emotion: 'neutral' })
    // Just use an ellipse path instead
    const oPath: number[][] = []
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2
      oPath.push(pt(cx + Math.cos(a) * hw * 0.5, cy + 2 + Math.sin(a) * 10))
    }
    ops.push(path('lineart', oPath, 2, '#0a0a1a'))
    void oOps  // suppress unused warning
    return ops
  }

  // Lip fill
  let fillY = cy - 6, fillH = 14
  if (emotion === 'happy') { fillY = cy - 4; fillH = 16 }
  if (emotion === 'sad')   { fillY = cy - 2; fillH = 12 }
  ops.push(frect('color', cx - hw, fillY, width, fillH, '#e8a0a0'))

  // Upper lip — cupid's bow shape, 9 points
  let upperPts: number[][]
  if (emotion === 'happy') {
    upperPts = [
      pt(cx - hw, cy - 2),
      pt(cx - hw * 0.7, cy - 5),
      pt(cx - hw * 0.3, cy - 5),
      pt(cx, cy - 3),
      pt(cx + hw * 0.3, cy - 5),
      pt(cx + hw * 0.7, cy - 5),
      pt(cx + hw, cy - 2),
    ]
  } else if (emotion === 'sad') {
    upperPts = [
      pt(cx - hw, cy + 3),
      pt(cx - hw * 0.7, cy - 3),
      pt(cx - hw * 0.25, cy - 7),
      pt(cx, cy - 4),
      pt(cx + hw * 0.25, cy - 7),
      pt(cx + hw * 0.7, cy - 3),
      pt(cx + hw, cy + 3),
    ]
  } else if (emotion === 'angry') {
    upperPts = [
      pt(cx - hw, cy - 5),
      pt(cx - hw * 0.6, cy - 4),
      pt(cx - hw * 0.2, cy - 8),
      pt(cx, cy - 5),
      pt(cx + hw * 0.2, cy - 8),
      pt(cx + hw * 0.6, cy - 4),
      pt(cx + hw, cy - 5),
    ]
  } else {
    upperPts = [
      pt(cx - hw,       cy - 1),
      pt(cx - hw + 6,   cy - 6),
      pt(cx - hw * 0.4, cy - 9),
      pt(cx - 4,        cy - 5),
      pt(cx,            cy - 6),
      pt(cx + 4,        cy - 5),
      pt(cx + hw * 0.4, cy - 9),
      pt(cx + hw - 6,   cy - 6),
      pt(cx + hw,       cy - 1),
    ]
  }
  ops.push(path('lineart', upperPts, 2, '#0a0a1a'))

  // Lower lip — fuller arc, 7 points
  let lowerDepth = cy + 10
  if (emotion === 'happy') lowerDepth = cy + 14
  if (emotion === 'sad')   lowerDepth = cy + 5
  if (emotion === 'angry') lowerDepth = cy + 4

  const lowerPts = [
    pt(cx - hw,       cy - 1),
    pt(cx - hw * 0.6, cy + (lowerDepth - cy) * 0.5),
    pt(cx - hw * 0.2, lowerDepth - 1),
    pt(cx,            lowerDepth),
    pt(cx + hw * 0.2, lowerDepth - 1),
    pt(cx + hw * 0.6, cy + (lowerDepth - cy) * 0.5),
    pt(cx + hw,       cy - 1),
  ]
  ops.push(path('lineart', lowerPts, 2, '#0a0a1a'))

  // Center crease
  ops.push(path('shadows', [pt(cx - 5, cy), pt(cx, cy + 1), pt(cx + 5, cy)], 2, '#c07070'))

  return ops
}

// ─── drawEar ──────────────────────────────────────────────────────────────────

type EarOp = Extract<CanvasOperation, { op: 'drawEar' }>

function expandEar(op: EarOp): CanvasOperation[] {
  const { cx, cy, side } = op
  const d = side === 'left' ? 1 : -1  // inner direction
  const ops: CanvasOperation[] = []

  // Skin fill
  ops.push(frect('color', cx - 12, cy - 24, 24, 48, '#FFE0BD'))

  // Outer ear shape — 7 pts
  ops.push(path('lineart', [
    pt(cx + d * 8,  cy - 22),
    pt(cx - d * 4,  cy - 18),
    pt(cx - d * 10, cy - 8),
    pt(cx - d * 12, cy),
    pt(cx - d * 10, cy + 8),
    pt(cx - d * 4,  cy + 18),
    pt(cx + d * 8,  cy + 22),
  ], 3, '#0a0a1a'))

  // Inner conch curve — 5 pts
  ops.push(path('lineart', [
    pt(cx + d * 4,  cy - 14),
    pt(cx - d * 2,  cy - 6),
    pt(cx - d * 4,  cy + 2),
    pt(cx - d * 2,  cy + 12),
    pt(cx + d * 4,  cy + 16),
  ], 2, '#1a1a2e'))

  // Ear lobe
  ops.push(path('lineart', [
    pt(cx + d * 6,  cy + 16),
    pt(cx + d * 2,  cy + 22),
    pt(cx + d * 8,  cy + 22),
  ], 2, '#1a1a2e'))

  return ops
}

// ─── drawNeck ─────────────────────────────────────────────────────────────────

type NeckOp = Extract<CanvasOperation, { op: 'drawNeck' }>

function expandNeck(op: NeckOp): CanvasOperation[] {
  const { cx, cy, width = 60, height = 80 } = op
  const hw = width / 2
  const ops: CanvasOperation[] = []

  // Skin fill
  ops.push(frect('color', cx - hw, cy, width, height, '#FFE0BD'))

  // Left neck edge
  ops.push(path('lineart', [
    pt(cx - hw,     cy),
    pt(cx - hw - 4, cy + height * 0.3),
    pt(cx - hw - 2, cy + height * 0.7),
    pt(cx - hw + 4, cy + height),
  ], 3, '#0a0a1a'))

  // Right neck edge
  ops.push(path('lineart', [
    pt(cx + hw,     cy),
    pt(cx + hw + 4, cy + height * 0.3),
    pt(cx + hw + 2, cy + height * 0.7),
    pt(cx + hw - 4, cy + height),
  ], 3, '#0a0a1a'))

  // Neck shadow
  ops.push(path('shadows', [
    pt(cx - hw + 6, cy + height * 0.1),
    pt(cx - hw + 4, cy + height * 0.9),
  ], 10, '#d4a8a8'))

  return ops
}

// ─── drawHair ─────────────────────────────────────────────────────────────────

type HairOp = Extract<CanvasOperation, { op: 'drawHair' }>

function expandHair(op: HairOp): CanvasOperation[] {
  const { crownX: cx, crownY: cy, color = '#2a1a0a', length = 'medium', style = 'straight' } = op
  const ops: CanvasOperation[] = []

  const isSpiky = style === 'spiky'
  const isWavy  = style === 'wavy'
  const hairLen = length === 'long' ? 480 : length === 'short' ? 120 : 280

  // ── Base fill block ──
  const fillW = isSpiky ? 190 : 230
  const fillH = isSpiky ? 130 : hairLen + 60
  ops.push(frect('color', cx - fillW / 2, cy - 10, fillW, fillH, color))

  // ── Crown silhouette arc ──
  const crownArc: number[][] = []
  for (let i = 0; i <= 14; i++) {
    const t = i / 14
    const angle = Math.PI + t * Math.PI
    const rx = isSpiky ? 95 : 105
    const ry = isSpiky ? 40 : 55
    crownArc.push(pt(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry + 10))
  }
  ops.push(path('lineart', crownArc, 4, '#0a0a1a'))

  if (isSpiky) {
    // ── Spiky hair — triangular spike paths ──
    for (let i = 0; i < 20; i++) {
      const angle = (-70 + i * 7.4) * (Math.PI / 180)
      const spikeLen = 50 + (i % 3) * 15
      const tipX = cx + Math.cos(angle) * spikeLen
      const tipY = cy + Math.sin(angle) * spikeLen - 30
      ops.push(path('lineart', [
        pt(cx + Math.cos(angle - 0.25) * 20, cy + 20),
        pt(tipX, tipY),
        pt(cx + Math.cos(angle + 0.25) * 20, cy + 20),
      ], 3, '#0a0a1a'))
      // Highlight on spike
      if (i % 4 === 0) {
        ops.push(frect('color', tipX - 2, tipY - 2, 4, spikeLen * 0.4, '#ffffff'))
      }
    }
    // Side tufts
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        ops.push(path('lineart', [
          pt(cx + side * (80 + i * 6), cy + 20 + i * 8),
          pt(cx + side * (90 + i * 8), cy + 35 + i * 8),
          pt(cx + side * (85 + i * 7), cy + 50 + i * 8),
        ], 2.5, '#0a0a1a'))
      }
    }
  } else {
    // ── Straight/wavy hair — strand paths ──

    // Left side strands
    for (let i = 0; i < 15; i++) {
      const sx = cx - 20 - i * 6
      const sy = cy + 10 + (i % 3) * 15
      const waveFactor = isWavy ? 12 : 3
      const waveDir = i % 2 === 0 ? 1 : -1
      ops.push(path('lineart', [
        pt(sx, sy),
        pt(sx - 5,  sy + hairLen * 0.13),
        pt(sx - 8 + waveFactor * waveDir, sy + hairLen * 0.27),
        pt(sx - 6,  sy + hairLen * 0.42),
        pt(sx - 2 + waveFactor * waveDir, sy + hairLen * 0.57),
        pt(sx + 2,  sy + hairLen * 0.71),
        pt(sx + 4 + waveFactor * waveDir * 0.5, sy + hairLen * 0.85),
        pt(sx + 3,  sy + hairLen),
      ], 2 + (i % 3 === 0 ? 1 : 0), '#0a0a1a'))
    }

    // Right side strands
    for (let i = 0; i < 15; i++) {
      const sx = cx + 20 + i * 6
      const sy = cy + 10 + (i % 3) * 15
      const waveFactor = isWavy ? 12 : 3
      const waveDir = i % 2 === 0 ? -1 : 1
      ops.push(path('lineart', [
        pt(sx, sy),
        pt(sx + 5,  sy + hairLen * 0.13),
        pt(sx + 8 + waveFactor * waveDir, sy + hairLen * 0.27),
        pt(sx + 6,  sy + hairLen * 0.42),
        pt(sx + 2 + waveFactor * waveDir, sy + hairLen * 0.57),
        pt(sx - 2,  sy + hairLen * 0.71),
        pt(sx - 4 + waveFactor * waveDir * 0.5, sy + hairLen * 0.85),
        pt(sx - 3,  sy + hairLen),
      ], 2 + (i % 3 === 0 ? 1 : 0), '#0a0a1a'))
    }

    // Bangs — 12 paths across forehead
    for (let i = 0; i < 12; i++) {
      const t = i / 11
      const bx = cx - 80 + t * 160
      const bangLen = 90 + Math.sin(t * Math.PI) * 30
      ops.push(path('lineart', [
        pt(bx, cy + 40),
        pt(bx - 4 + t * 8, cy + 70),
        pt(bx - 2 + t * 4, cy + 40 + bangLen),
        pt(bx + t * 6,     cy + 50 + bangLen),
      ], 3, '#0a0a1a'))
    }

    // Hair highlights
    for (let i = 0; i < 4; i++) {
      const hx = cx - 60 + i * 30
      ops.push(frect('color', hx, cy + 20, 5, hairLen * 0.4, '#ffffff'))
    }

    // Hair shadow under mass
    ops.push(frect('shadows', cx - 100, cy + 20, 200, hairLen * 0.3, '#1a1008'))
  }

  return ops
}

// ─── drawBlush ────────────────────────────────────────────────────────────────

type BlushOp = Extract<CanvasOperation, { op: 'drawBlush' }>

function expandBlush(op: BlushOp): CanvasOperation[] {
  const { cx, cy, side } = op
  const d = side === 'right' ? 1 : -1
  const ops: CanvasOperation[] = []

  // Outer soft blush
  ops.push(circle('shadows', cx, cy, 18, '#f4b8b8'))
  // Inner brighter
  ops.push(circle('shadows', cx, cy, 10, '#f09090'))

  // 3 horizontal dash lines
  for (let i = 0; i < 3; i++) {
    const lineY = cy + 8 + i * 5
    ops.push(path('lineart', [
      pt(cx + d * (-14 + i * 2), lineY),
      pt(cx + d * (-4 - i),      lineY),
    ], 1, '#e07070'))
  }

  return ops
}

// ─── drawBackground ───────────────────────────────────────────────────────────

type BgOp = Extract<CanvasOperation, { op: 'drawBackground' }>

function expandBackground(op: BgOp): CanvasOperation[] {
  const { style = 'gradient', color1 = '#dce8f0', color2 = '#f0f0f8', width: W = 800, height: H = 1200 } = op
  const ops: CanvasOperation[] = []

  if (style === 'plain') {
    ops.push(frect('background', 0, 0, W, H, color1))
    return ops
  }

  if (style === 'screentone') {
    ops.push(frect('background', 0, 0, W, H, '#f8f8f8'))
    // Dot grid
    for (let y = 0; y < H; y += 20) {
      for (let x = 0; x < W; x += 20) {
        const offset = (Math.floor(y / 20) % 2) * 10
        ops.push(circle('background', x + offset, y, 2.5, '#e0e0e8'))
      }
    }
    return ops
  }

  if (style === 'sparkle') {
    // Gradient base
    ops.push(frect('background', 0, 0, W, H / 2, color1))
    ops.push(frect('background', 0, H / 2, W, H / 2, color2))
    // Sparkle stars
    const sparklePositions = [
      [80, 60], [200, 120], [350, 80], [550, 40], [700, 110],
      [120, 300], [420, 250], [620, 320], [730, 200], [50, 450],
      [300, 500], [500, 430], [680, 490], [150, 650], [480, 600],
      [700, 700], [100, 820], [380, 780], [620, 850], [250, 950],
    ]
    for (const [sx, sy] of sparklePositions) {
      const size = 6 + (sx % 3) * 3
      ops.push(path('background', [
        pt(sx, sy - size), pt(sx, sy + size),
      ], 1.5, '#ffffff'))
      ops.push(path('background', [
        pt(sx - size, sy), pt(sx + size, sy),
      ], 1.5, '#ffffff'))
      ops.push(path('background', [
        pt(sx - size * 0.6, sy - size * 0.6), pt(sx + size * 0.6, sy + size * 0.6),
      ], 1, '#ffffffaa'))
    }
    return ops
  }

  // Default: gradient (4 horizontal bands)
  const bands = [color1, blendColors(color1, color2, 0.33), blendColors(color1, color2, 0.66), color2]
  bands.forEach((c, i) => {
    ops.push(frect('background', 0, i * H / 4, W, H / 4, c))
  })

  return ops
}

/** Simple hex color blend (no external deps) */
function blendColors(c1: string, c2: string, t: number): string {
  const parse = (c: string) => {
    const h = c.replace('#', '')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const [r1, g1, b1] = parse(c1)
  const [r2, g2, b2] = parse(c2)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// ─── Main export ─────────────────────────────────────────────────────────────

const SEMANTIC_OPS = new Set([
  'drawFace', 'drawEye', 'drawEyebrow', 'drawNose', 'drawMouth',
  'drawEar', 'drawNeck', 'drawHair', 'drawBlush', 'drawBackground'
])

export function expandSemanticOps(ops: CanvasOperation[]): CanvasOperation[] {
  const result: CanvasOperation[] = []
  for (const op of ops) {
    if (!SEMANTIC_OPS.has(op.op)) {
      result.push(op)
      continue
    }
    switch (op.op) {
      case 'drawFace':       result.push(...expandFace(op));       break
      case 'drawEye':        result.push(...expandEye(op));        break
      case 'drawEyebrow':    result.push(...expandEyebrow(op));    break
      case 'drawNose':       result.push(...expandNose(op));       break
      case 'drawMouth':      result.push(...expandMouth(op));      break
      case 'drawEar':        result.push(...expandEar(op));        break
      case 'drawNeck':       result.push(...expandNeck(op));       break
      case 'drawHair':       result.push(...expandHair(op));       break
      case 'drawBlush':      result.push(...expandBlush(op));      break
      case 'drawBackground': result.push(...expandBackground(op)); break
    }
  }
  return result
}
