---
title: 'Story 3.2b — Durcissement benchmark OpenRouter'
type: feature
created: '2026-08-29'
status: done
review_loop_iteration: 0
baseline_commit: NO_VCS
context:
  - _bmad-output/implementation-artifacts/spec-3-2-benchmark-openrouter-auto.md
  - _bmad-output/implementation-artifacts/deferred-work.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le benchmark MVP (Story 3.2) est séquentiel, sans retry 429, sans garde-fou concurrence, et avec scoring/validation Excalidraw simplistes — les modèles free sont faussement scored à 0 et le wall-clock est long.

**Approach:** Paralléliser les scénarios et modèles (concurrence limitée), retry backoff sur 429, Mutex global sur `run_benchmark`, config via `.fun/ai.json`, scoring taille gradué, validation `version == 2`, tests staleness.

## Boundaries & Constraints

**Always:**
- Réutiliser `chat_completion` existant avec retry intégré.
- Modèles candidats et intervalle staleness configurables dans `ai.json` (champs optionnels).
- Mutex empêche deux benchmarks simultanés.

**Never:**
- Appeler des modèles non-`:free`.
- Exposer les détails au WebView au-delà de l'existant.

</frozen-after-approval>

## Code Map

- `src-tauri/src/ai/client.rs` — retry 429 avec backoff exponentiel (3 tentatives).
- `src-tauri/src/ai/benchmark.rs` — parallélisation `join3` + Semaphore(2), Mutex, scoring log, version Excalidraw.
- `src-tauri/src/project/ai_config.rs` — champs `candidate_models`, `benchmark_staleness_days`.
- `src-tauri/src/recent.rs` — dedup canonique corrigée (symlinks).

## Tasks & Acceptance

**Execution:**
- [x] Retry 429 dans client OpenRouter
- [x] Parallélisation scénarios/modèles + Mutex benchmark
- [x] Config ai.json pour modèles candidats et staleness
- [x] Scoring gradué + validation version 2
- [x] Tests staleness + dedup recents

**Manual checks:**
- `cargo test` — 58 tests passent.
