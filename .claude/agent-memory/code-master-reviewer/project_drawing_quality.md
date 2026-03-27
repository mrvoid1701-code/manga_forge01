---
name: Drawing Quality — Feature Proposals and Architecture Decisions
description: Root cause analysis of drawing quality gap, library evaluation, Krita assessment, and bezier as #1 recommended fix
type: project
---

Analysis date: 2026-03-27. User requested priority-ranked evaluation of drawing quality improvements.

## Root cause confirmed (from code reading)
The primary quality issue is layer-manager.ts line 56-57: every addPath renders as M/L polylines (straight
line segments), never cubic bezier. This is a self-imposed constraint — Fabric.js v7 supports full SVG path
data natively. Secondary issue: skin/hair fills are addFilledRect (axis-aligned rectangles) that bleed
outside organic lineart contours — no clipping mechanism exists.

## Krita integration: not recommended for current architecture
- DBus API (Linux only) — not available on Windows 11
- Windows IPC requires: Next.js → local Flask server → Krita Python plugin → TCP socket → render → export PNG
- Krita not headless; requires visible window, ~2-5s startup, no concurrency
- Difficulty: 8/10 — wrong tool for a web app
- Only viable if pivoting to Electron desktop app with Krita as bundled dependency

## Alternative library ranking (by manga line quality vs. Fabric.js)
1. Paper.js — bezier-first, path.smooth() auto-smooths polylines, Boolean path ops (clip fills), Canvas2D
2. SVG.js — browser-native AA, clipPath for organic fills, AI can generate SVG path strings; slow for 200+ objects
3. Konva.js — faster dirty-rect than Fabric.js but same geometry limitation, no quality gain without bezier fix
4. PixiJS — WebGL sprite renderer, wrong tool for illustration
5. Two.js — thin abstraction, low gain

## SVG direct generation (AI outputs raw SVG markup)
- Higher quality ceiling (real bezier, clipPath, gradients)
- Cons: 3000-6000 token responses, harder to sanitize, no streaming, XSS surface (need DOMPurify with SVG allowlist)
- Worth experimenting but not a drop-in solution

## Priority order (confirmed)
1. Fix P0 bugs first (id, setFill, z-index — see project_canvas_bugs.md)
2. Bezier paths: add `pathData?: string` to addPath op, use it in layer-manager.ts, update prompt rule 5
3. Clip color fills to face/body contours (Fabric.js clipPath or closed bezier fills)
4. Screentone/hatching: new addScreentone op
5. Speech bubbles: new addSpeechBubble compound op
6. Speed lines: new addSpeedLines op
7. Composition guides layer
8. Line taper: NOT recommended — requires pressure/velocity data AI cannot generate

**Why bezier is #1:** Layer-manager builds M/L polylines from points[]. Fabric v7 already parses SVG path data.
Fix is: add pathData field to schema, one conditional in layer-manager, updated prompt syntax example. ~3-4h total.

**Why clipping is #2:** addFilledRect rectangles bleed outside face oval contour. Fabric.js clipPath property
on individual objects or switching fills to closed bezier paths fixes this. Immediately visible quality gain.

**How to apply:** When user asks about quality improvements, lead with bezier fix (3-4h, highest ROI).
When discussing architecture migrations, acknowledge Paper.js/SVG.js are valid long-term paths but only
after fixing the geometry representation first. Never recommend Krita for the web app deployment model.
