---
title: 'Story 1.4 — Lister les diagrammes du Projet'
type: feature
created: '2026-09-10'
status: done
baseline_commit: 7f970072adc56137d1b35e15c9de6bc56928a3ef
review_loop_iteration: 0
context:
  - _bmad-output/implementation-artifacts/epic-1-context.md
  - _bmad-output/implementation-artifacts/spec-1-3-open-project-init-fun.md
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Après ouverture d'un Projet, l'atelier n'avait pas de spec pour afficher le nom du Projet et la liste des diagrammes déjà présents sous `.fun/diagrams/` (FR-1, Story 1.4).

**Approach:** Commande Tauri `list_diagrams` (lecture sous `.fun/diagrams/` uniquement) ; `WorkshopLayout` charge la liste à l'ouverture ; `DiagramList` dans le canvas ; hint « Nouveau diagramme » si la liste est vide (UX-DR12). Le nom du Projet reste dans la toolbar.

## Boundaries & Constraints

**Always:**
- Lecture via commande Tauri uniquement (AD-1, AD-5).
- Chemins listés uniquement sous `project_root/.fun/diagrams/`.
- Microcopy française, ton calme (NFR-8).
- Afficher le nom du Projet dans l'atelier (FR-1).

**Ask First:** Aucun.

**Never:**
- Écrire ou scanner le code source hors `.fun/`.
- Exposer le filesystem WebView (`fs` / chemins bruts hors invoke).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Projet avec fichiers | `.fun/diagrams/*.excalidraw` (et formats ultérieurs) | Nom du Projet + liste des diagrammes | Message UI si invoke échoue |
| Projet sans diagramme | Dossier `diagrams/` vide ou absent | Hint « Nouveau diagramme », pas de liste | N/A |
| Path atelier invalide | `/workshop?path=` introuvable | Redirect accueil (Story 1.3) | Message français |

</frozen-after-approval>

## Code Map

- `src-tauri/src/project/diagram.rs` — `list_diagrams` (ignore extensions inconnues)
- `src-tauri/src/commands.rs` — handler `list_diagrams`
- `src/lib/diagram.ts` — `listDiagrams()`
- `src/components/workshop/WorkshopLayout.tsx` — charge la liste au mount
- `src/components/workshop/DiagramList.tsx` — nav liste (null si vide)
- `src/components/workshop/CanvasArea.tsx` — hint état vide
- `src/components/workshop/Toolbar.tsx` — nom du Projet
- `src/app/workshop/page.tsx` — `open_project` avant rendu atelier

## Tasks & Acceptance

**Execution:**
- [x] Commande Rust `list_diagrams` + tests unit (liste + vide)
- [x] Frontend invoke + `DiagramList` + nom Projet toolbar
- [x] Hint vide « Nouveau diagramme » (UX-DR12)
- [x] Tests React liste vide / noms affichés / hint canvas

**Acceptance Criteria:**
- Given un Projet avec des fichiers dans `.fun/diagrams/`, when l'atelier charge, then Fun affiche le nom du Projet et la liste des diagrammes (FR-1).
- Given un Projet sans diagramme, when l'atelier charge, then un hint « Nouveau diagramme » s'affiche (UX-DR12).
- Given `/workshop?path=` invalide, when l'atelier tente d'ouvrir, then redirect accueil (pas de liste fantôme).

## Spec Change Log

- 2026-09-10 — Spec rétroactive : le code existait sans artifact 1.4.

## Verification

**Commands:**
- `cargo test list_diagrams --manifest-path src-tauri/Cargo.toml` — expected: exit 0
- `npx vitest run src/test/diagram-list.test.tsx` — expected: exit 0

**Manual checks:**
- Ouvrir un projet avec plusieurs `.excalidraw` : liste + nom Projet visibles.
- Ouvrir un projet neuf : hint Nouveau diagramme, bouton toolbar identique.

## Suggested Review Order

**Liste Rust**

- Filtrage par extension sous `.fun/diagrams/`
  [`diagram.rs:341`](../../src-tauri/src/project/diagram.rs#L341)

- Commande Tauri
  [`commands.rs:334`](../../src-tauri/src/commands.rs#L334)

**UI atelier**

- Chargement liste
  [`WorkshopLayout.tsx:117`](../../src/components/workshop/WorkshopLayout.tsx#L117)

- Liste + hint vide
  [`DiagramList.tsx:31`](../../src/components/workshop/DiagramList.tsx#L31)
  [`CanvasArea.tsx:130`](../../src/components/workshop/CanvasArea.tsx#L130)

- Nom Projet
  [`Toolbar.tsx:52`](../../src/components/workshop/Toolbar.tsx#L52)
