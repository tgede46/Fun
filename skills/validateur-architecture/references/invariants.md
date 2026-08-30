# Invariants d'Architecture Fun (AD-1 à AD-9)

This document defines the architectural invariants for the Fun project (Tauri 2 + Next.js static export).

Each invariant has an ID, a short statement, the rationale, and verification criteria.

## AD-1 — Tauri Commands Naming

**Rule:** All Tauri commands must use `snake_case` identifiers.

**Rationale:** Tauri 2 convention; consistency across the codebase.

**Verification:** Run `grep -r "@tauri\|invoke\|\[\{\@tauri/```" src/ — check command names follow snake_case.

**Status:** Enforced on all new commands.

---

## AD-2 — WebView Must Not Call HTTP Directly

**Rule:** The WebView (frontend) must not make direct HTTP calls to external services. All external HTTP must go through a Tauri command (Rust).

**Rationale:** Secrets management, controlled API surface, offline-first design.

**Verification:**
- Search frontend code for `fetch(`, `axios`, `openrouter`, API keys embedded in JS
- If found, flag as potential violation

**Status:** Enforced.

---

## AD-3 — Secrets Stay on Rust Side

**Rule:** API keys, tokens, and secrets must never be embedded in frontend code or exposed to WebView. They stay in Rust, passed to Tauri commands.

**Rationale:** Security; prevent token leakage via browser devtools or network inspection.

**Verification:**
- Check `.env` files are gitignored
- Check no secrets in JS/TS files
- Check Tauri config exposes only what's needed

---

## AD-4 — OpenRouter via Rust Command Only

**Rule:** Calls to OpenRouter (or any AI service) must be initiated from a Tauri command in Rust, not from the WebView.

**Rationale:** See AD-2 and AD-3 — control the call, hide the key.

**Verification:**
- Search for OpenRouter references in frontend
- Verify any AI interaction goes through `invoke("...")` to a Rust command

---

## AD-5 — `.fun/` Only for Project Writable Data

**Rule:** Any data written by Fun (settings, diagrams, recent projects, cache) must go under `{project_root}/.fun/`. No writing elsewhere.

**Rationale:** Predictable storage location; works with Tauri's scope and security model.

**Verification:**
- Search `fs::write`, `write_file`, path constructions in Rust
- Verify paths start with `.fun/` or resolve under it

---

## AD-6 — Modular Architecture

**Rule:** The codebase must stay modular. Each feature/component has a clear boundary. No god-classes, no circular dependencies.

**Rationale:** Maintainability, testability.

**Verification:**
- Review new files — do they have a single responsibility?
- Check imports/exports for circular patterns

---

## AD-7 — No Main Thread Blocking

**Rule:** Long-running or I/O operations must not block the main thread. In Tauri, use `spawn_blocking` or async callbacks for disk/network I/O.

**Rationale:** Responsiveness; prevent UI freeze.

**Verification:**
- Check Rust code for blocking I/O calls on the main thread
- Look for `spawn_blocking` wraps around `fs::write`, network calls, etc.

---

## AD-8 — Tests Pass for Story Scope

**Rule:** For any story, `cargo test` and `npm run build` must exit cleanly in the story's scope. If failures relate to missing symbols in other files (out of scope), note them but don't block.

**Rationale:** Quality gate without false negatives from cross-story dependencies.

**Verification:**
- Run `cargo test` and `npm run build` after implementation
- Classify failures: in-scope (block) vs out-of-scope (note)

---

## AD-9 — Specs Are Source

**Rule:** The spec file for a story (`_bmad-output/implementation-artifacts/spec-*.md`) is the source of truth. Code must match the spec. If code diverges, update the spec or flag the gap.

**Rationale:** Traceability, shared understanding, audit trail.

**Verification:**
- Compare story implementation against its spec
- List any gaps (missing AC, extra features, different behavior)
- For new behavior not in spec: propose spec update

---

## Status Legend

- **Enforced** — actively verified in reviews and CI
- **Advisory** — recommended but not yet automated
- **Pending** — defined but not yet applicable (future story)

---

*Document maintained alongside the architecture spine.*
*Last updated: 2026-08-30*
