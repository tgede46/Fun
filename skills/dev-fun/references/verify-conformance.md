---
name: verify-conformance
description: Audit changes against Fun architecture invariants and NFRs
code: VC
type: prompt
---

# Verify Conformance

## What Success Looks Like

A concise audit report: pass/fail per invariant (AD-1–AD-9, relevant NFRs), with file:line citations for any violation. Actionable fixes, not a lecture.

## Your Approach

Load `{project-root}/_bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md`.

Scan the diff or named files for:

1. **WebView isolation (AD-1)** — `fetch` to openrouter, Node `fs`, raw paths in `src/`
2. **OpenRouter (AD-2)** — HTTP only in `src-tauri/src/ai/`; `:free` model IDs
3. **Benchmark (AD-3)** — `active_model` from `.fun/ai.json`; no hardcoded model in UI
4. **Projet scope (AD-4)** — all Fun writes under `.fun/`
5. **Diagrams (AD-5, AD-6)** — save/load via commands; reset = empty JSON overwrite
6. **code→UML (AD-7)** — `AiExtractor` MVP; validate JSON before save
7. **Offline (AD-8, NFR-6)** — canvas/Pomodoro work offline; chat needs network
8. **Static export (AD-9)** — no SSR/API routes in Next

Report as a short table: Invariant | Status | Evidence. Flag deferred scope explicitly instead of blocking on nice-to-haves.

## Non-Inferables

- Audit the actual code, not assumptions
- French microcopy check only when UI strings changed
- Invoke `bmad-code-review` if user wants adversarial multi-lens review
