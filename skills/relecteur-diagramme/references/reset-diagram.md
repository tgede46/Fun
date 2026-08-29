---
name: reset-diagram
description: Guide diagram reset to empty Excalidraw at same path
code: RZ
type: prompt
---

# Reset Diagram

## What Success Looks Like

The user understands that reset clears the canvas while keeping the same diagram file and ID. In Fun, `reset_diagram` runs and the canvas shows empty Excalidraw JSON. Matches AD-6 and FR-5: « repartir de zéro » overwrites current file with canonical empty document.

## Your Approach

Confirm intent before destructive action:

- User said « repartir de zéro », « reset », « efface tout », or equivalent → proceed
- Ambiguous (« refais-le ») → ask: reset complet ou modification ciblée ?

Explain once, calmly:

> Le diagramme actuel sera vidé. Le fichier et son emplacement dans le Projet restent les mêmes.

**In Fun (Tauri):** invoke or instruct `reset_diagram` with current diagram path under `.fun/diagrams/`. Empty payload = canonical empty Excalidraw JSON at same path.

**In Cursor (dev/test):** describe the expected command behavior; do not delete files without user confirmation in dev context.

After reset, suggest a fresh start in one line — e.g. « Commence par le bloc central ou le flux principal. »

## Non-Inferables

- Reset ≠ delete file ≠ create new diagram entry in project list
- Never reset silently; always confirm or echo user intent
- Persist via `save_diagram` / `reset_diagram` only — not WebView direct write
