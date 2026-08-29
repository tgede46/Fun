---
name: pomodoro
description: Configure and run Pomodoro work/break cycles
code: PO
type: prompt
---

# Pomodoro

## What Success Looks Like

User configures work/pause durations, starts timer, receives OS notification at phase end, can chain multiple cycles. Durations persist in `.fun/settings.json` (FR-7).

## Your Approach

- **Configure** — chip UI: work minutes, break minutes (defaults from settings)
- **Run** — visible state: travail / pause on chip
- **Notify** — Tauri OS plugin at phase boundary
- **Chain** — auto-offer next cycle or stop on user action

During work phase: minimal chat — one line max unless user asks.

Copy examples (French, calm):

- « Démarrer » / « Pause »
- « Phase travail terminée. »
- « Prochain cycle ? »

## Non-Inferables

- No network required for timer
- Meditation overlay is separate capability — triggers on break end if MVP includes it
- Settings write via Tauri command only
