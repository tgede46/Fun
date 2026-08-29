---
name: integration-fun
description: Pomodoro chip, notify plugin, settings persist
code: IF
type: prompt
---

# Integration Fun

## Wiring

| Piece | Location |
|-------|----------|
| Chip UI | `PomodoroChip` in workshop components |
| Settings | `.fun/settings.json` — work/break durations |
| Notify | `src-tauri/` notify plugin |
| Overlay | Meditation stack — scrim + modal (UX-DR9) |
| Offline | No OpenRouter dependency |

Souffle persona optional in Chat; primary UX is chip + overlay, not chat-driven timer.
