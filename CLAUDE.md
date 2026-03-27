# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (runs prisma generate first)
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma studio    # GUI for the SQLite database
```

## Architecture

MangaForge is a Next.js 14 (App Router) manga creation platform where an AI agent draws on a Fabric.js canvas by emitting **structured JSON operations** — never image data or pixels.

### The drawing pipeline (end-to-end)

```
User prompt
  → AIPromptInput.tsx
  → runAIAgent() in src/lib/ai/index.ts          # routes to correct LLM provider
  → callGemini() / callAnthropic() / callOpenAI() # returns raw JSON text
  → extractJSON() + sanitizeOperations()           # cleans + post-processes ops
  → applyOperations() registered in canvas-store   # calls applyOperation() per op
  → layer-manager.ts applyOperation()              # creates Fabric.js objects
  → canvas.renderAll()                             # single render after full batch
```

### Canvas layer system

Five layers rendered bottom-to-top via `LAYER_Z_BASE` in `layer-manager.ts`:
```
background (0) → color (1000) → shadows (2000) → sketch (3000) → lineart (4000)
```
Color fills are always below lineart. Each layer gets 1000 z-index slots to preserve insertion order within a layer.

### Key files and their roles

| File | Role |
|---|---|
| `src/lib/ai/canvas-operations.ts` | `buildSystemPrompt()` — pre-computes all landmark coordinates (headCY, eyeY, etc.) so AI has zero ambiguity. `sanitizeOperations()` — post-processor: guarantees clearLayer prepend, clamps coordinates, enforces eye symmetry |
| `src/lib/canvas/layer-manager.ts` | `applyOperation()` — maps each `CanvasOperation` to Fabric.js API. `enforceLayerOrder()` — moves newly added objects to correct z-index band |
| `src/types/canvas.ts` | `CanvasOperation` union type — single source of truth for all drawable operations |
| `src/store/canvas-store.ts` | Zustand store. `applyOperations` and `getPreviewUrl` are registered here by `MangaCanvas` to avoid prop-drilling |
| `src/store/ai-store.ts` | Persists AI provider config (including API key) to localStorage via Zustand `persist` |

### Critical implementation details

**Circle coordinates use center origin.** `layer-manager.ts` creates circles with `originX: 'center', originY: 'center'`. This means `x`/`y` in `addShape` circle ops = visual center, NOT top-left corner. The system prompt and `sanitizeOperations()` both rely on this.

**`sanitizeOperations()` always runs.** Located in `canvas-operations.ts`, called in `src/lib/ai/index.ts` for ALL providers. It: (1) prepends clearLayer for all 5 layers, (2) clamps coordinates to canvas bounds (also clamps width/height to prevent overflow), (3) detects eye circles by y-position and enforces x-symmetry around canvas center.

**Gemini returns JSON inside markdown fences.** All providers use `extractJSON()` in `gemini.ts` (3-strategy fallback: raw parse → brace extraction → fence strip). Anthropic and OpenAI also strip fences as a precaution.

**No SSR for AI config.** `AIPromptInput` uses a `mounted` state guard before reading from Zustand persist (which reads localStorage) to prevent hydration mismatch on `disabled` attributes.

### AI provider architecture

`src/lib/ai/index.ts` routes to four providers. All share `buildSystemPrompt(canvasState)` and return `AIResponse { operations: CanvasOperation[], explanation: string }`.

Default models: Anthropic → `claude-opus-4-6`, OpenAI → `gpt-4o`, Gemini → `gemini-3-flash-preview`, Grok → `grok-2`.

Gemini uses REST (`v1beta` endpoint) with `generationConfig: { temperature: 0.4, responseMimeType: 'application/json' }`. The others use their official SDKs with `dangerouslyAllowBrowser: true` (calls originate from browser, not server).

### Planned improvements (not yet implemented)

- `manga-rules.ts` — contextual rule injection based on prompt keywords (angry → expression rules, action → speed line rules)
- `canvas-constants.ts` — extract shared landmark coordinates (headCY, eyeY etc.) out of `canvas-operations.ts`
- Bezier/Catmull-Rom smooth path conversion in `layer-manager.ts`
- Screentone patterns, speech bubbles, speed lines as new operation types
- Undo/Redo via Fabric.js history

### Database

Prisma + SQLite (`prisma/schema.prisma`). Models: `User`, `Character`, `Project`. DB is not used in the current MVP — character and project persistence is local only.
