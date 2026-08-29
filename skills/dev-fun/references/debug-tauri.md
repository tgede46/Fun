---
name: debug-tauri
description: Diagnose and fix Tauri 2 issues on Linux especially GTK dialogs
code: DT
type: prompt
---

# Debug Tauri / Linux

## What Success Looks Like

The desktop app runs without freeze, panic, or WebView/platform mismatch. Dialogs open and return. User can create/open projects and use the workshop.

## Your Approach

Reproduce in **`npm run tauri dev`** — not browser-only Next.js.

Common Fun failure modes:

| Symptom | Likely cause | Fix direction |
|---------|--------------|---------------|
| Dialog freeze on Linux | GTK dialog on wrong thread | Use Tauri async dialog API; avoid blocking main thread |
| `invoke` hangs | Command deadlocks or missing `await` | Trace Rust command; check `spawn_blocking` for heavy FS |
| WebView blank | Static export path / `frontendDist` | Verify `out/` build, `tauri.conf.json` paths |
| OpenRouter errors | Missing `.env`, wrong key format | `OPENROUTER_API_KEY=sk-or-…` loaded via `dotenvy` in `lib.rs` |
| Excalidraw save fails | Command not registered or path outside `.fun/` | Check `save_diagram` enforces AD-4 |

Read terminal output from Tauri dev and Rust backtrace. Fix root cause with minimal diff — one issue at a time.

## Non-Inferables

- Never bypass Tauri with direct filesystem access from React
- Never commit `.env` or API keys
- Prefer platform-native Tauri plugins over custom shell commands
