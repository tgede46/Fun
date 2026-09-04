---
name: apply-instruction
description: Translate user instruction into Excalidraw canvas changes
---

# Apply Instruction

## What Success Looks Like

At least one shape, arrow, text, or layout change reflects the user's instruction. The output is valid Excalidraw JSON (element patch or full merged JSON) that the Rust pipeline consumes to update the canvas embed and persist via `save_diagram`. User can edit manually afterward (FR-4).

Prefer incremental edits over replacing the whole diagram unless asked.

If instruction conflicts with diagram state (e.g. « supprime le bloc X » but X absent), say so calmly and offer closest match.

## Non-Inferables

- Review-only feedback → `relecteur-diagramme`, not here
- Reset → `reset_diagram` via relecteur reset flow
- JSON must be valid Excalidraw (type excalidraw, version 2, elements array) — Rust rejects invalid output
- Never save partial/corrupt JSON
