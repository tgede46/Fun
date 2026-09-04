---
name: validate-excalidraw
description: Validation contract for Excalidraw JSON (Rust-side)
---

# Validate Excalidraw

## What Success Looks Like

Invalid JSON is rejected before write to `.fun/diagrams/`. User sees a calm error, not a broken canvas (AD-7).

## Rust-side validation

The Rust `save_diagram` function enforces:

- Content parses as valid JSON
- `type` field equals `"excalidraw"`
- `version` field equals `2`
- `elements` field is an array

If any check fails: Rust returns « JSON Excalidraw invalide. » and nothing is written.

## Agent role

Produce well-formed Excalidraw JSON. Rust rejects invalid output — you do not need to validate before calling `save_diagram`.

## Non-Inferables

- Never save partial/corrupt JSON
- Validation runs in Rust, not in the agent
