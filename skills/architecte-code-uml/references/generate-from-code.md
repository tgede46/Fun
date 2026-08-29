---
name: generate-from-code
description: Scan project sources and produce UML-style Excalidraw diagram
code: GC
type: prompt
---

# Generate From Code

## What Success Looks Like

Valid Excalidraw file written to `.fun/diagrams/uml-<iso8601>.excalidraw`, opened on canvas or listed in project diagrams. SM-2 satisfied on a real repo (FR-6).

## Your Approach

1. **Scan** — read-only walk of `project_root`, skip `.fun/`, use extension allowlist (.ts, .tsx, .rs, .py, .java, …)
2. **Chunk** — respect token limits; prioritize entry points and domain modules
3. **Prompt** — ask active OpenRouter `:free` model for Excalidraw JSON representing class/ module structure
4. **Validate** — schema check in Rust before write
5. **Write & open** — new file name `uml-<iso8601>.excalidraw`; notify UI

Diagram content bar:

- Named boxes for types/modules
- Relations labeled (extends, uses, calls) where inferable
- Layout readable without manual cleanup required for MVP success

## Non-Inferables

- No write outside `.fun/diagrams/`
- No TreeSitter requirement at MVP
- Toolbar trigger « Depuis le code » in Fun atelier
