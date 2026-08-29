---
title: 'Story 3.1 — Configurer la clé OpenRouter et modèle par défaut'
type: feature
created: '2026-08-29'
status: done
baseline_commit: dca0f87171ad9c1327ad8415a298c56a7b5f1c07
review_loop_iteration: 0
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Aucune clé OpenRouter ni client IA — le chat est un placeholder. Impossible d'appeler les modèles `:free` de façon sécurisée.

**Approach:** Stocker la clé via keyring OS (hors WebView) ; module Rust OpenRouter avec endpoint v1 et garde `:free` ; modèle seed par défaut jusqu'au benchmark ; UI paramètres sur l'accueil + statut modèle dans le chat atelier.

## Boundaries & Constraints

**Always:**
- Clé `sk-or-…` uniquement côté Rust (AD-2, NFR-4, AD-1).
- Endpoint `https://openrouter.ai/api/v1`.
- Modèle seed : `google/gemma-2-9b-it:free` si `active_model` absent dans `.fun/ai.json`.
- Jamais renvoyer la clé au WebView après enregistrement.
- Seuls modèles se terminant par `:free` éligibles.

**Ask First:**
- Aucun.

**Never:**
- Benchmark auto (Story 3.2).
- Chat fonctionnel / streaming (Story 3.3).
- fetch OpenRouter depuis React.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Enregistrer clé | Saisie `sk-or-…` valide | Stockage keyring ; UI « configurée » | Erreur si format invalide |
| Clé invalide format | Saisie sans `sk-or-` | Refus | Message UI |
| Modèle par défaut | ai.json sans active_model | Retourne seed `:free` | N/A |
| Modèle benchmark | ai.json avec active_model | Retourne active_model | N/A |
| Modèle non free | ID sans `:free` | Refus côté Rust | Erreur invoke |
| Statut sans clé | Chat atelier | Hint configurer clé | N/A |

</frozen-after-approval>

## Code Map

- `src-tauri/src/ai/mod.rs`, `secrets.rs`, `openrouter.rs`, `model.rs` — **new**
- `src-tauri/src/project/ai_config.rs` — lecture `.fun/ai.json`
- `src-tauri/src/commands.rs` — `set_openrouter_api_key`, `get_ai_status`
- `src/lib/ai.ts` — invoke helpers
- `src/components/home/OpenRouterSettings.tsx` — **new** formulaire clé
- `src/components/home/HomeScreen.tsx` — intégrer settings
- `src/components/workshop/ChatSidebar.tsx` — afficher modèle actif / hint clé

## Tasks & Acceptance

**Execution:**
- [x] Module ai Rust (secrets, openrouter, model resolve)
- [x] Commandes + permissions + keyring deps
- [x] UI accueil + chat statut

**Acceptance Criteria:**
- Given paramètres Fun, when je saisis clé `sk-or-…`, then Tauri stocke hors WebView.
- Given aucun benchmark, when j'ouvre le Chat, then modèle `:free` seed affiché.
- Given requête IA future, when validation modèle, then seuls `:free` éligibles.

## Spec Change Log

## Verification

**Commands:** lint, build, `cargo test ai::`

**Manual:** accueil → saisir clé → atelier chat affiche modèle seed.

## Suggested Review Order

**Stockage sécurisé**

- Validation format `sk-or-` et keyring OS
  [`secrets.rs:4`](../../src-tauri/src/ai/secrets.rs#L4)

**Résolution modèle**

- Seed `:free` vs `active_model` benchmark
  [`model.rs:28`](../../src-tauri/src/ai/model.rs#L28)

**Commandes & UI**

- `set_openrouter_api_key` / `get_ai_status`
  [`commands.rs:198`](../../src-tauri/src/commands.rs#L198)

- Formulaire accueil OpenRouter
  [`OpenRouterSettings.tsx:1`](../../src/components/home/OpenRouterSettings.tsx#L1)

- Statut modèle dans le chat atelier
  [`ChatSidebar.tsx:1`](../../src/components/workshop/ChatSidebar.tsx#L1)
