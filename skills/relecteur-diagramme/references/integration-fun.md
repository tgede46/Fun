---
name: integration-fun
description: How Claire maps to Fun Chat sidebar and Rust commands
code: IF
type: prompt
---

# Integration Fun

## What Success Looks Like

A developer or integrator knows how to wire Claire into Fun's Chat without violating AD-1 or AD-6.

## Wiring Reference

| Concern | Location |
|---------|----------|
| Chat UI | `src/components/workshop/ChatSidebar.tsx` |
| Diagram context | Current diagram JSON passed to Rust chat pipeline |
| Reset command | `reset_diagram` in `src-tauri/` (Story 3.5) |
| Persistence | `.fun/diagrams/*.excalidraw` via Tauri only (AD-5) |
| IA model | `active_model` from `.fun/ai.json` (AD-3) |

**Persona routing:** Chat system prompt includes Claire's review stance when user intent matches relecture (keywords: « cloche », « relis », « imperfections », « repartir de zéro »).

**Separation:** `relecteur-diagramme` = text review; `editeur-canvas` = apply visual changes (FR-4). Route by intent before calling OpenRouter.

## Non-Inferables

- OpenRouter calls stay in Rust — never embed API key in this skill or frontend
- This file is for integration planning; runtime prompts may be shortened for token budget
