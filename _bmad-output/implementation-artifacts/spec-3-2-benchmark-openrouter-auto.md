---
title: 'Story 3.2 — Benchmark automatique OpenRouter tous les 3 jours'
type: feature
created: '2026-08-29'
status: 'done'
review_loop_iteration: 0
baseline_commit: ac32fea98ec1be24c1f777504bee56a8732b45f6
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/epic-3-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le modèle IA est figé sur le seed par défaut `google/gemma-2-9b-it:free` — les modèles free évoluent, de nouveaux arrivent, et le meilleur choix change sans cesse. Sans benchmark, l'utilisateur obtient des résultats sous-optimaux sans le savoir.

**Approach:** Exécuter automatiquement une suite de tests courte (chat, validité JSON diagramme, smoke code→UML) sur les modèles `:free` éligibles, tous les 3 jours. Le modèle gagnant est persisté dans `.fun/ai.json` comme `active_model`. Le benchmark se déclenche au démarrage de Fun ou à l'ouverture d'un projet si l'intervalle est dépassé et que Fun est online.

## Boundaries & Constraints

**Always:**
- Seuls les modèles `:free` (suffixe `:free`) sont éligibles au benchmark.
- La suite de test reste ≤5 scénarios × N modèles pour respecter le quota free (~50 req/jour OpenRouter).
- Le résultat est écrit dans `.fun/ai.json` : `active_model`, `last_benchmark_at`, `last_scores`.
- Le client HTTP reqwest existant (`src-tauri/src/ai/client.rs`) est réutilisé — pas de nouveau client.
- Le benchmark est déclenché au démarrage ou à l'ouverture d'un projet, jamais en background permanent.
- Si Fun est offline quand le benchmark est dû, il est reporté — le dernier `active_model` reste utilisé.

**Ask First:**
- Aucun.

**Never:**
- Appeler des modèles non-`:free` pendant le benchmark.
- Utiliser un scheduler cron ou tâche background persistante.
- Télécharger des packages de scheduling externes.
- Exposer les scores détaillés au WebView (seul `active_model` et `last_benchmark_at` sont pertinents pour l'utilisateur).

</frozen-after-approval>

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Premier lancement (pas de `last_benchmark_at`) | `ai.json` sans champ ou champ null | Benchmark exécuté, modèle actif mis à jour | Erreur réseau → conserver seed par défaut |
| Dernier benchmark > 3 jours | `last_benchmark_at` datant de >72h | Nouveau benchmark exécuté | Erreur réseau → report silencieux, ancien modèle conservé |
| Dernier benchmark ≤ 3 jours | `last_benchmark_at` récent | Aucun benchmark, utiliser `active_model` existant | N/A |
| Fun offline | Pas de connexion réseau | Benchmark reporté au prochain lancement online | Aucune erreur visible, seed par défaut conservé |
| Modèle `:free` indisponible | Timeout ou erreur 4xx/5xx sur un modèle | Ce modèle scored à 0, le meilleur des autres est choisi | Pas d'erreur fatale — benchmark continue avec les autres modèles |
| Tous les modèles échouent | Aucun modèle ne répond | Conserver l'ancien `active_model` ou seed | Message de warning dans les logs, pas d'erreur UI |
| Quota dépassé | 429 Too Many Requests | Arrêter le benchmark, conserver modèle actuel | Log warning, pas de crash |
| `ai.json` corrompu ou illisible | JSON invalide | Utiliser defaults, exécuter benchmark | Log warning, écraser avec defaults |

## Code Map

- `src-tauri/src/ai/model.rs` — `resolve_active_model()` / `resolve_active_model_for_project()` : résolution seed vs benchmark. Constante `DEFAULT_FREE_MODEL` (ligne 4). `ActiveModelInfo` struct (ligne 22).
- `src-tauri/src/ai/client.rs` — `chat_completion()` : client reqwest POST vers OpenRouter. Réutilisé pour les appels benchmark. Timeout 120s (ligne 35).
- `src-tauri/src/ai/secrets.rs` — `load_api_key()` : charge la clé depuis l'env `OPENROUTER_API_KEY`.
- `src-tauri/src/ai/openrouter.rs` — `is_free_model()`, `assert_free_model()`, constante `OPENROUTER_API_BASE`.
- `src-tauri/src/project/ai_config.rs` — `AiConfig` struct (ligne 8) avec `active_model`, `last_benchmark_at`, `last_scores`. `read_ai_config()` (ligne 19). **Manque `write_ai_config()`** — à créer.
- `src-tauri/src/project/init.rs` — `default_ai_json()` (ligne 75), `ensure_fun_structure()` (ligne 85).
- `src-tauri/src/commands.rs` — commandes IA existantes : `get_ai_status` (ligne 211), `get_openrouter_key_configured` (ligne 206).
- `src-tauri/src/lib.rs` — `run()` : point d'entrée Tauri, enregistrement des commands (ligne 28). Le benchmark doit se déclencher ici ou via une command appelée au démarrage.
- `src-tauri/Cargo.toml` — reqwest 0.12 + serde_json + chrono déjà installés.

## Tasks & Acceptance

**Execution:**
- [x] `src-tauri/src/project/ai_config.rs` -- Ajouter `write_ai_config(project_root, config)` pour persister `active_model`, `last_benchmark_at`, `last_scores` dans `.fun/ai.json`
- [x] `src-tauri/src/ai/benchmark.rs` -- **Nouveau module** : `BenchmarkRunner` avec `run_benchmark(api_key, models) -> BenchmarkResult` — exécute la suite de test sur une liste de modèles et retourne les scores
- [x] `src-tauri/src/ai/benchmark.rs` -- `check_and_run_if_stale(api_key, project_root) -> Result<Option<BenchmarkResult>, String>` — vérifie `last_benchmark_at` et lance le benchmark si >3 jours
- [x] `src-tauri/src/ai/benchmark.rs` -- `select_best_model(scores) -> &str` — retourne le modèle avec le meilleur score composite (qualité + latence)
- [x] `src-tauri/src/ai/mod.rs` -- Déclarer `pub mod benchmark;` et réexporter `check_and_run_if_stale`, `ModelScore`
- [x] `src-tauri/src/commands.rs` -- Ajouter commande Tauri `run_benchmark(project_path)` pour déclenchement manuel + retour du résultat
- [x] `src-tauri/src/lib.rs` -- Enregistrer `run_benchmark` dans `invoke_handler`
- [x] `src-tauri/permissions/app-commands.toml` -- Ajouter `run_benchmark` aux permissions
- [x] `src/lib/ai.ts` -- Ajouter helper `invoke('run_benchmark', { projectPath })` pour le frontend
- [x] `src-tauri/src/ai/benchmark.rs` -- Tests unitaires : scoring, sélection meilleur modèle, validation Excalidraw

**Acceptance Criteria:**
- Given Fun au lancement avec `last_benchmark_at` absent ou >3 jours, when la clé OpenRouter est configurée, then le benchmark s'exécute et `.fun/ai.json` est mis à jour avec `active_model`, `last_benchmark_at`, `last_scores`.
- Given Fun au lancement avec `last_benchmark_at` <3 jours, when le projet s'ouvre, then aucun benchmark n'est lancé — `active_model` est utilisé tel quel.
- Given Fun offline quand le benchmark est dû, when le prochain lancement a lieu, then le benchmark s'exécute — l'ancien `active_model` n'est jamais perdu avant le succès.
- Given le benchmark terminé, when un des modèles échoue, then il est exclu du classement sans faire échouer le reste.
- Given `run_benchmark` appelé manuellement depuis l'UI, when le benchmark termine, then le résultat est affiché (modèle actif + scores).
- Given tous les modèles échouent, when le benchmark termine, then l'ancien `active_model` est conservé et aucun crash n'a lieu.

## Spec Change Log

## Verification

**Commands:**
- `cargo test ai::benchmark` -- tests unitaires du module benchmark
- `cargo test ai::model` -- tests de résolution de modèle
- `cargo test project::ai_config` -- tests de lecture/écriture ai.json
- `cargo build --no-default-features` -- compilation sans erreur

**Manual checks:**
- Supprimer `last_benchmark_at` de `.fun/ai.json` → lancer Fun → vérifier que le benchmark s'exécute et met à jour le fichier.
- Mettre `last_benchmark_at` à une date >3 jours → lancer Fun → vérifier re-exécution.
- Mettre `last_benchmark_at` à aujourd'hui → lancer Fun → vérifier pas de re-exécution.
- Déconnecter le réseau → lancer Fun → vérifier pas de crash, seed par défaut conservé.

## Suggested Review Order

**Benchmark Runner (cœur de la feature)**

- Orchestrateur : vérification fraîcheur + exécution + persistance
  [`benchmark.rs:197`](../../src-tauri/src/ai/benchmark.rs#L197)
- Scoring composite : succès (50) + taille (30) + excalidraw (20)
  [`benchmark.rs:95`](../../src-tauri/src/ai/benchmark.rs#L95)
- Validation Excalidraw JSON avec gestion fences markdown
  [`benchmark.rs:75`](../../src-tauri/src/ai/benchmark.rs#L75)
- Sélection meilleur modèle (String, pas de fuite mémoire)
  [`benchmark.rs:244`](../../src-tauri/src/ai/benchmark.rs#L244)

**Persistance config**

- Écriture `.fun/ai.json` avec création dossier auto
  [`ai_config.rs:33`](../../src-tauri/src/project/ai_config.rs#L33)

**Commande Tauri**

- run_benchmark avec gestion StalenessCheck
  [`commands.rs:296`](../../src-tauri/src/commands.rs#L296)

**Intégration frontend**

- Helper invoke et type RunBenchmarkResult
  [`ai.ts:65`](../../src/lib/ai.ts#L65)

**Permissions et registration**

- Permission Tauri pour run_benchmark
  [`app-commands.toml:91`](../../src-tauri/permissions/app-commands.toml#L91)
- Enregistrement dans invoke_handler
  [`lib.rs:45`](../../src-tauri/src/lib.rs#L45)

**Tests**

- Tests unitaires scoring, sélection, validation Excalidraw
  [`benchmark.rs:258`](../../src-tauri/src/ai/benchmark.rs#L258)
- Tests roundtrip read/write ai_config
  [`ai_config.rs:43`](../../src-tauri/src/project/ai_config.rs#L43)
