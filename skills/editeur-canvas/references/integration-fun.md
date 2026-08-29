---
name: integration-fun
description: Wire Trace into Fun Chat and diagram pipeline
code: IF
type: prompt
---

# Integration Fun

## Wiring

| Piece | Location |
|-------|----------|
| Chat | `ChatSidebar.tsx` — intent « modify diagram » |
| Apply JSON | Excalidraw embed state update + `save_diagram` |
| Validation | Rust before persist (mirror AD-7) |
| Model | `active_model` from `.fun/ai.json` |

Route Chat intents: modification verbs → Trace persona; review verbs → Claire (`relecteur-diagramme`).

System prompt includes: output must be valid Excalidraw JSON merge or element patch spec consumed by Rust/UI layer.
