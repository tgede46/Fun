# Brownfield — Floating Office

Points d'ancrage dans le codebase Fun existant.

## Chat IA (Story 3.3–3.5 done)

| Fichier | Rôle actuel |
|---------|-------------|
| `src/components/workshop/ChatSidebar.tsx` | Panneau chat fixe 320px — messages, input, statut IA |
| `src/components/workshop/WorkshopLayout.tsx` | State chat, `handleSendChat`, benchmark, canvas |
| `src/lib/ai.ts` | `sendChatMessage()`, types `ChatTurn`, `SendChatResult` |
| `src/lib/chat-storage.ts` | Persistance sessionStorage historique chat |
| `src-tauri/src/ai/chat.rs` | Backend async chat, personas, diagram_update |

**Gap :** pas de traitement « fermer overlay pendant loading » avec notif à la fin ; chat bloqué en sidebar.

## Pomodoro / Souffle (Epic 4 done)

| Fichier | Rôle actuel |
|---------|-------------|
| `src/components/workshop/PomodoroChip.tsx` | Fixe `bottom-4 left-1/2`, config + timer |
| `src/hooks/usePomodoro.ts` | Timer, cycles, save durées |
| `src/components/workshop/MeditationOverlay.tsx` | Overlay pause méditation |
| `src-tauri/src/notify.rs` | `notify_pomodoro_phase`, permissions notification |

**Gap :** pas draggable ; pas lofi audio ; pas scène travail.

## Settings

| Fichier | Rôle |
|---------|------|
| `src/lib/settings.ts` | `theme`, `pomodoro_work_minutes`, `pomodoro_break_minutes` |
| `src-tauri/src/project/settings.rs` | Lecture/écriture `.fun/settings.json` |

**Extension requise :** positions compagnons (`companion_chat_x/y`, `companion_pomo_x/y`), `lofi_enabled`, `lofi_volume`, `chat_sound_enabled`.

## Permissions Tauri

`src-tauri/capabilities/default.json` — inclure `notification:default`, `allow-notify-pomodoro-phase` ; ajouter permission notify chat si commande dédiée.

## Régressions à éviter

- Sauvegarde Excalidraw debounce (`ExcalidrawCanvas.tsx`)
- Suppression diagramme (`delete_diagram`)
- Sanitization JSON IA (`excalidraw-sanitize.ts`)
