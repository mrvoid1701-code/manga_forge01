---
name: MangaForge Project Overview
description: Next.js manga drawing app with Fabric.js canvas, AI-driven drawing via Claude, layered architecture
type: project
---

MangaForge is a Next.js (App Router, TypeScript) application for AI-assisted manga drawing.

Stack:
- Fabric.js v7 for canvas rendering (uses `fabric.FabricText`, not deprecated `fabric.Text`)
- Zustand for canvas state (`useCanvasStore`, `setApplyOperations` pattern)
- Claude AI generates JSON operation batches (100-200 ops) that are applied to the canvas
- Canvas dimensions: configurable via `canvasState.width/height`

Key files:
- `src/types/canvas.ts` — LayerType, CanvasState, CanvasOperation union type
- `src/lib/canvas/layer-manager.ts` — applyOperation dispatcher, LAYER_ORDER, LAYER_OPACITY
- `src/lib/ai/canvas-operations.ts` — buildSystemPrompt() for AI, proportions, rules
- `src/components/canvas/MangaCanvas.tsx` — Fabric canvas init, applyOperations callback

Layer stack (bottom to top): background -> sketch -> lineart -> shadows -> color

**Why:** Understanding this architecture is needed to reason about z-order, coordinate systems, and AI prompt fidelity.
**How to apply:** When reviewing canvas or AI issues, always check if LAYER_ORDER is respected at render time, not just conceptually.
