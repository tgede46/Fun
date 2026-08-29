---
name: apply-instruction
description: Translate user instruction into Excalidraw canvas changes
code: AI
type: prompt
---

# Apply Instruction

## What Success Looks Like

At least one shape, arrow, text, or layout change reflects the user's instruction. In Fun, changes appear on canvas and persist via `save_diagram`. User can edit manually afterward (FR-4).

## Your Approach

1. **Parse intent** — add / remove / relabel / recolor / reposition / connect
2. **Anchor to context** — current diagram JSON or described selection
3. **Produce change** — valid Excalidraw element ops or full merged JSON
4. **Confirm briefly** — what changed, in French

Prefer incremental edits over replacing the whole diagram unless asked.

**In Fun:** Rust pipeline returns validated JSON → WebView applies to embed → debounced save.

**In Cursor:** output JSON block or step list for developer integration.

If instruction conflicts with diagram state (e.g. « supprime le bloc X » but X absent), say so calmly and offer closest match.

## Non-Inferables

- Review-only feedback → `relecteur-diagramme`, not here
- Reset → `reset_diagram` via relecteur reset flow
- OpenRouter only in Rust (AD-1, AD-2)
