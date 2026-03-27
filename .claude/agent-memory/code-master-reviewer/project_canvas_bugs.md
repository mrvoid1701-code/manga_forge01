---
name: Canvas Critical Bugs — MangaForge
description: Critical bugs found in canvas system: hardcoded transparent fill, missing object id, z-index not enforced, setFill/setStroke broken
type: project
---

Critical bugs identified in review on 2026-03-27:

1. `addShape` and `addPath` hardcode `fill: 'transparent'` — AI cannot color shapes. fillColor/strokeColor/opacity missing from CanvasOperation types.

2. `addPath`/`addShape` never set `id` on Fabric objects, but `setFill`/`setStroke` search by `(o as any).id` — those operations are completely broken (always find nothing).

3. No z-index enforcement — `canvas.add()` appends in call order, not layer order. Shadows can render above lineart.

4. `LAYER_ORDER` is duplicated in both `canvas.ts` and `layer-manager.ts` — desync risk.

5. Mobile scaling: canvas is initialized at scaled pixel size but AI generates coordinates for logical size — misalignment on mobile.

6. `canvas.renderAll()` called after every single operation in the batch (100-200 ops) — causes visible flickering.

**Why:** These bugs explain all three reported symptoms: residue (z-order), misplaced eyes (empty transparent shapes), bad colors/shadows (fill always transparent).
**How to apply:** When implementing fixes, address fill/strokeColor in types first, then id assignment, then z-index insertion helper.
