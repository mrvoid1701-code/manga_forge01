# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MangaForge** is an AI-assisted manga creation platform. The core differentiator is that the AI agent operates directly on the **structural representation** of the canvas (coordinates, objects, layers, line parameters as JSON), not on rasterized pixels. This enables precision and editability impossible with conventional image generators.

The platform is **LLM-agnostic**: users bring their own API key (Claude, OpenAI, Gemini, Grok), and MangaForge acts as the orchestration layer on top.

## Core Architecture Decisions

- **Canvas:** Built on [Fabric.js](http://fabricjs.com/) — every visual element is a JSON object with precise properties (position, dimensions, color, stroke width, layer). The AI agent reads and writes this JSON state directly.
- **AI Layer:** The agent receives the current canvas JSON state, interprets natural language instructions, and returns structured drawing operations — not image data.
- **No pixel manipulation:** All AI operations are vector/object-level. The agent never generates or interprets rasterized images.
- **LLM integration:** Abstract over multiple providers. Users supply their own API key. The orchestration logic must remain provider-neutral.

## Key Functional Domains

1. **Canvas engine** — Fabric.js canvas with layers: sketch, line art, shadows, background
2. **AI agent** — Takes canvas JSON + user prompt → returns canvas operations
3. **Character system** — Save/load character definitions (proportions, traits, line style, palette) for cross-frame consistency
4. **Style library** — Manga conventions: line weight variation, facial expressions, motion effects, screentones
5. **Export** — Formats compatible with Webtoon Canvas, Tapas, and similar publishing platforms

## Monetization Tiers (context for feature gating)

- **Free:** Limited monthly generation
- **Creator (~15–20 EUR/mo):** Full style library, professional export
- **Studio (~50–80 EUR/mo):** Team collaboration, multi-project management
