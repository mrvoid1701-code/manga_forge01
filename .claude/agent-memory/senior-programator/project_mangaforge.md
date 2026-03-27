---
name: MangaForge Project Context
description: Architecture, stack, and key decisions for the MangaForge AI manga creation platform
type: project
---

MangaForge is an AI-assisted manga creation web platform hosted at https://github.com/mrvoid1701-code/manga_forge01.

**Stack:**
- Next.js 16.2.1 App Router + TypeScript, working directory: `C:\Users\tigan\Desktop\MANGA_Forge`
- `src/` layout — tsconfig paths map `@/*` to `./src/*`
- Tailwind CSS, Zustand v5 for state, Prisma + SQLite for DB, next-auth for auth
- Fabric.js **v7.2.0** for the canvas (JSON-structural, not pixel-based)
  - In v7: `fabric.Text` is deprecated — use `fabric.FabricText` instead
  - `renderAll()` and `requestRenderAll()` both exist in v7

**Core architecture:**
- 5-layer canvas system: background, sketch, lineart, shadows, color (defined in `LAYER_ORDER`)
- LLM-agnostic AI orchestrator (`src/lib/ai/index.ts`) — routes to Anthropic, OpenAI, Gemini, Grok based on `AIConfig.provider`
- AI operates by returning structured `CanvasOperation[]` JSON (never image data)
- Operations applied to Fabric.js canvas via `applyOperation()` in `src/lib/canvas/layer-manager.ts`
- Canvas-to-AI communication: `MangaCanvas` registers `applyOperations` in Zustand `canvas-store` (`setApplyOperations`); `AIPromptInput` reads it from the store. The old `window.__mangaCanvasApply` pattern was replaced due to race condition.

**Key files:**
- `src/types/canvas.ts` — `LayerType`, `CanvasOperation` union type, `CanvasState`, `LAYER_ORDER`
- `src/types/ai.ts` — `AIProvider`, `AIConfig`, `AIMessage`, `AIResponse`
- `src/lib/ai/canvas-operations.ts` — builds the system prompt sent to the LLM
- `src/store/ai-store.ts` — persists `AIConfig` (provider + API key) to localStorage via zustand/persist
- `src/store/character-store.ts` — character library persisted to localStorage
- `prisma/schema.prisma` — User, Character, Project models (SQLite dev)

**Canvas rendering fixes applied (2026-03-27):**
- `addShape` now accepts optional `fillColor`, `strokeColor`, `strokeWidth` — all previously hardcoded to transparent/black
- New `addFilledRect` operation added to `CanvasOperation` union — required for all solid color fills (skin, iris, lips, hair, background); AI instructed to use this instead of `addShape` for fills
- `clearLayer` fix: `.filter().slice()` snapshot pattern ensures decoupling from Fabric v7 live collection before removal loop
- Layer Z-ordering enforced via `enforceLayerOrder()` in `layer-manager.ts` using `LAYER_Z_BASE` (background:0, sketch:1000, lineart:2000, shadows:3000, color:4000)
- All objects created with `selectable: false, evented: false` to prevent accidental interaction
- `sanitizeOperations()` added to `canvas-operations.ts` — post-processes ALL AI responses: prepends clearLayer for all 5 layers, clamps coordinates, enforces eye symmetry; called in `src/lib/ai/index.ts` as single sanitization point for all providers

**Why:** Freemium manga platform (Free/Creator/Studio tiers). Users bring their own API keys.

**How to apply:** When extending the AI system, follow the provider pattern in `src/lib/ai/providers/`. When adding canvas tools, use `CanvasOperation` union and implement in `applyOperation()`. For color fills, always use `addFilledRect`. Sanitization runs automatically in `runAIAgent()` — no need to sanitize in individual providers.
