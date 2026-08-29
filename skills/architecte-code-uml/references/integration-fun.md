---
name: integration-fun
description: Rust AiExtractor and toolbar wiring
code: IF
type: prompt
---

# Integration Fun

## Wiring

| Piece | Location |
|-------|----------|
| Trait | `CodeExtractor` in `src-tauri/src/project/` or `ai/` |
| MVP impl | `AiExtractor` — multi-extension scan + OpenRouter |
| Command | e.g. `generate_diagram_from_code` |
| UI | Toolbar « Depuis le code » |
| Output | `.fun/diagrams/uml-<iso8601>.excalidraw` |

Benchmark suite includes smoke code→UML scenario (AD-3).

Deferred: `TreeSitterExtractor` — plug without UI contract change.
