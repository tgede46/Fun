---
name: validate-excalidraw
description: Validate Excalidraw JSON before save
code: VE
type: prompt
---

# Validate Excalidraw

## What Success Looks Like

Invalid model output is rejected before write to `.fun/diagrams/`. User sees a calm error, not a broken canvas (AD-7).

## Your Approach

Check before save:

- Top-level structure parseable JSON
- Required Excalidraw fields present (`type`, `version`, `elements` or equivalent for embed version)
- Elements array items have ids and recognizable types
- No path traversal or filesystem paths embedded in JSON

If invalid: do not call `save_diagram`. Surface « Réponse IA invalide — réessaie ou reformule. »

If valid: proceed to apply and save.

## Non-Inferables

- Validation runs in Rust at MVP — this capability documents the bar for prompts and dev review
- Never save partial/corrupt JSON « to see what happens »
