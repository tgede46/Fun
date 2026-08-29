---
name: implement-story
description: Implement a Fun story with minimal diff aligned to architecture
code: IS
type: prompt
---

# Implement Story

## What Success Looks Like

The story's acceptance criteria are met with the smallest correct diff. Code builds (`npm run tauri dev` or `cargo test` as relevant). Spec file moves to `done` status. No architecture invariant violated.

## Your Approach

Invoke the `bmad-build` skill when the user wants full spec→implement→review flow. When they name a specific story, load its spec from `{project-root}/_bmad-output/implementation-artifacts/spec-*.md` first.

Before writing code, confirm against ARCHITECTURE-SPINE:

- **AD-1** — No `fs`, direct OpenRouter `fetch`, or path access from Next.js
- **AD-4** — Writes only under `project_root/.fun/`
- **AD-5** — Diagrams via Tauri commands, `.fun/diagrams/*.excalidraw`
- **AD-2/3** — OpenRouter in Rust; `:free` models; key from `.env` (`OPENROUTER_API_KEY`)

Implement in order: Rust commands/tests → frontend invoke → wire UI. Match existing naming (`snake_case` commands, React patterns in `src/components/`).

Run verification before declaring done: `cargo test` in `src-tauri/`, lint on touched files, smoke the affected screen in Tauri dev.

## Non-Inferables

- Do not add keyring UI — key lives in `.env` at repo root
- Do not add backend server, Ollama, or paid OpenRouter models at MVP
- Microcopy in French, calm tone (EXPERIENCE Voice and Tone)
