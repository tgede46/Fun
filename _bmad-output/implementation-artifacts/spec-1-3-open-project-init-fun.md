---
title: 'Story 1.3 — Ouvrir un dossier et initialiser `.fun/`'
type: feature
created: '2026-08-29'
status: done
baseline_commit: NO_VCS
review_loop_iteration: 0
context:
  - _bmad-output/implementation-artifacts/epic-1-context.md
  - _bmad-output/implementation-artifacts/spec-1-2-home-recent-projects.md
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ouvrir un dossier ne crée pas encore la structure Projet `.fun/` ni n'enregistre le périmètre d'écriture Fun (AD-4, FR-1).

**Approach:** Commande Tauri `open_project` : valide le dossier, initialise `.fun/` (fichiers JSON par défaut + `diagrams/`), met à jour les recents et l'état courant ; le frontend l'appelle depuis l'accueil et l'atelier.

## Boundaries & Constraints

**Always:**
- Écritures disque uniquement sous `project_root/.fun/` (AD-4, NFR-2).
- Fichiers initiaux : `project.json`, `settings.json`, `ai.json`, dossier `diagrams/` — créés seulement s'absents.
- Timestamps ISO 8601 UTC dans `project.json`.
- Commande `open_project` côté Tauri ; React invoke uniquement (AD-1).

**Ask First:** Aucun.

**Never:**
- Modifier le code source hors `.fun/`.
- Écraser des fichiers `.fun/` existants.
- Lister les diagrammes (story 1.4), canvas, IA.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Premier open | Dossier valide sans `.fun/` | Crée `.fun/` + defaults + recents | N/A |
| Re-open | Dossier avec `.fun/` partiel | Complète fichiers/dossiers manquants | N/A |
| Dossier invalide | Path absent ou fichier | Erreur française, pas de navigation | Message UI |
| Atelier direct | URL `/workshop?path=` | Re-valide via `open_project` | Redirect accueil si échec |

</frozen-after-approval>

## Code Map

- `src-tauri/src/project/init.rs` — `ensure_fun_structure`, defaults JSON (new)
- `src-tauri/src/commands.rs:open_project` — orchestration open + recents + state
- `src-tauri/src/state.rs` — `AppState.current_project` (new)
- `src/components/home/HomeScreen.tsx:40` — remplace remember par `open_project`
- `src/app/workshop/page.tsx:7` — invoke `open_project` au chargement

## Tasks & Acceptance

**Execution:**
- [x] `src-tauri/src/project/init.rs` — création `.fun/` idempotente
- [x] `open_project` command + `AppState` project_root courant
- [x] `HomeScreen` — CTA et cartes appellent `open_project`
- [x] `workshop/page.tsx` — validation path via `open_project`

**Acceptance Criteria:**
- Given un dossier valide choisi, when `open_project`, then `.fun/` existe avec les 3 JSON et `diagrams/`.
- Given `.fun/` déjà présent, when `open_project`, then aucun fichier existant n'est écrasé.
- Given path invalide, when open, then erreur UI sans écriture disque.
- Given Projet ouvert, when Fun écrit, then seul `.fun/` est touché (init story).

## Verification

**Commands:**
- `npm run build` — expected: exit 0
- `cargo check` — expected: exit 0

**Manual checks:**
- Ouvrir un dossier test via `npm run tauri dev` ; vérifier `.fun/project.json`, `settings.json`, `ai.json`, `diagrams/`.

## Suggested Review Order

**Initialisation Projet (AD-4)**

- Création idempotente `.fun/` et defaults JSON.
  [`init.rs:78`](../../src-tauri/src/project/init.rs#L78)

- Commande `open_project` : validate → init → recents → state.
  [`commands.rs:22`](../../src-tauri/src/commands.rs#L22)

**État session**

- Mémorisation du project_root courant côté Rust.
  [`state.rs:3`](../../src-tauri/src/state.rs#L3)

**Intégration UI**

- Accueil délègue l'ouverture à `open_project`.
  [`HomeScreen.tsx:47`](../../src/components/home/HomeScreen.tsx#L47)

- Atelier re-valide le path au chargement.
  [`page.tsx:28`](../../src/app/workshop/page.tsx#L28)
