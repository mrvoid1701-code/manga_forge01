---
name: MangaForge Technical Roadmap — Manga Rules & Quality Addons
description: Planned improvements: manga-rules.ts system, bezier curves, hatching, undo/redo, SVG export
type: project
---

Discussed and proposed (2026-03-27) a set of improvements for drawing quality and AI-guided manga conventions.

**manga-rules.ts system:**
- New file: `src/lib/ai/manga-rules.ts` — categorized rules (anatomy, expressions, effects, perspective, composition, inking, screentones)
- Each rule has: triggers (keyword array), instruction (injected text), priority (int)
- `selectRelevantRules(userPrompt, limit)` — keyword matching, scores by trigger count, sorts by score then priority
- `formatRulesForPrompt(rules)` — formats selected rules as a block appended to buildSystemPrompt()
- Integration: `buildSystemPrompt(canvasState, userPrompt?)` — userPrompt is optional, backward-compatible

**Why:** Static system prompt has no contextual awareness. "Furios" generates same prompt as "portret calm." Rules system injects relevant manga conventions based on what user typed.

**Planned addons (prioritized):**
1. Bezier curves via Catmull-Rom in `path-utils.ts` — replaces M/L with M/C in addPath, highest visual impact
2. SVG export via `canvas.toSVG()` in `export.ts` — trivial, already in Fabric.js
3. Reference grid in `reference-grid.ts` — proportion lines matching buildSystemPrompt coordinates
4. `addHatching` operation in canvas.ts + applyOperation — parallel diagonal lines for shadows
5. Undo/redo via operation-log in canvas-store.ts — re-apply batches, NOT snapshot-based
6. Procedural speed lines in `manga-effects.ts` — generateSpeedLines(focal, W, H) returns CanvasOperation[]

**canvas-constants.ts:** Recommended to extract landmark coordinates (headCY, eyeY, etc.) shared between buildSystemPrompt and reference-grid to avoid desync.

**How to apply:** When implementing, start with bezier curves (path-utils.ts, 3-hour effort, zero risk). manga-rules.ts is second priority. Both are non-breaking changes.
