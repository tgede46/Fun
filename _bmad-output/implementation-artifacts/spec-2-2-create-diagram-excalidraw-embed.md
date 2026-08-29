---
title: 'Story 2.2 — Créer un diagramme et embed Excalidraw'
type: feature
created: '2026-08-29'
status: done
baseline_commit: NO_VCS
review_loop_iteration: 0
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/spec-2-1-layout-atelier-design-tokens.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'atelier affiche un placeholder « Canvas » sans éditeur de dessin. Impossible de créer un fichier `.excalidraw` ni de dessiner — le cœur métier (FR-2, Epic 2) est absent.

**Approach:** Ajouter `@excalidraw/excalidraw` en embed client-only dans `CanvasArea` ; commandes Tauri `create_diagram` et `load_diagram` pour créer/charger le JSON sous `.fun/diagrams/` ; bouton « Nouveau diagramme » dans la toolbar ouvre un diagramme vide et l'affiche dans l'embed.

## Boundaries & Constraints

**Always:**
- Écritures disque uniquement sous `project_root/.fun/diagrams/` (AD-4, AD-5).
- Fichiers nommés en `kebab-case.excalidraw` ; création auto sans dialogue modal (ex. `sketch-20260829-143000.excalidraw`).
- Document vide canonique : `type: excalidraw`, `version: 2`, `elements: []`, `appState.viewBackgroundColor: #ffffff`, `files: {}`.
- Embed Excalidraw chargé via `next/dynamic` avec `ssr: false` (AD-9, static export).
- Invocations Tauri depuis React uniquement ; pas de chemins fichier exposés au WebView hors commandes (AD-1, AD-5).
- Conserver le layout 4 zones de la story 2.1 ; l'embed remplit la zone canvas.

**Ask First:**
- Aucun.

**Never:**
- `save_diagram`, sauvegarde debounced, rechargement à la réouverture (Story 2.3).
- Liste complète des diagrammes existants (Story 1.4).
- Toggle thème clair/sombre dans l'embed (Story 2.4).
- Écrire hors `.fun/` ou lire/écrire le code source du projet.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Nouveau diagramme | Projet ouvert, clic « Nouveau diagramme » | Fichier `.fun/diagrams/sketch-<timestamp>.excalidraw` créé ; embed affiche canvas vide | Message UI si échec Tauri |
| Dessin libre | Diagramme chargé dans l'embed | Crayon, formes, texte visibles sur le canvas (état React en mémoire) | N/A |
| Création doublon nom | Deux clics rapides | Deux fichiers distincts (timestamps différents) | N/A |
| Chemin invalide load | `load_diagram` hors `.fun/diagrams/` | Refus côté Rust | Erreur `{ message }` à l'UI |
| Pas de diagramme actif | Atelier ouvert, aucun diagramme créé | Hint « Nouveau diagramme » dans la zone canvas (UX-DR12) | N/A |
| Excalidraw SSR | Build Next static export | Pas d'erreur hydration ; composant client-only | dynamic import |

</frozen-after-approval>

## Code Map

- `src-tauri/src/project/diagram.rs` — **new** : `empty_excalidraw_json()`, `create_diagram(project_root)`, `load_diagram(path)` avec validation chemin sous `.fun/diagrams/`
- `src-tauri/src/project/mod.rs` — **update** : `pub mod diagram`
- `src-tauri/src/commands.rs` — **update** : handlers `create_diagram`, `load_diagram` ; structs de réponse sérialisables
- `src-tauri/src/lib.rs` — **update** : enregistrer les deux commandes dans `generate_handler!`
- `src-tauri/permissions/app-commands.toml` — **update** : permissions `allow-create-diagram`, `allow-load-diagram`
- `src-tauri/capabilities/default.json` — **update** : référencer les nouvelles permissions
- `package.json` — **update** : dépendance `@excalidraw/excalidraw` (version npm courante)
- `src/lib/diagram.ts` — **new** : helpers `invoke('create_diagram')`, `invoke('load_diagram')`, types TS
- `src/components/workshop/ExcalidrawCanvas.tsx` — **new** : wrapper client `dynamic(..., { ssr: false })`, props `initialData`, remplit `.workshop-canvas`
- `src/components/workshop/CanvasArea.tsx` — **update** : état vide (hint) ou `<ExcalidrawCanvas initialData={...} />`
- `src/components/workshop/Toolbar.tsx` — **update** : bouton « Nouveau diagramme », callback `onNewDiagram`
- `src/components/workshop/WorkshopLayout.tsx` — **update** : état diagramme actif (`path`, `initialData`), orchestration create→load→canvas
- `src/app/workshop/page.tsx` — **update** si besoin : passer handlers/état (sinon tout dans Layout)
- `src/app/globals.css` — **update** : styles pour embed pleine hauteur dans `.workshop-canvas` (overflow hidden)
- `src/components/workshop/CanvasArea.tsx` L5-11 — placeholder actuel à remplacer (read-only evidence)
- `src-tauri/src/project/init.rs` L87-90 — `.fun/diagrams/` déjà créé à l'ouverture projet (reuse, read-only)

## Tasks & Acceptance

**Execution:**
- [x] `src-tauri/src/project/diagram.rs` — implémenter JSON vide canonique, création fichier kebab-case, load avec garde-fou chemin — AD-5
- [x] `src-tauri/src/commands.rs` + `lib.rs` + permissions — exposer `create_diagram`, `load_diagram` — AD-1
- [x] `package.json` — ajouter `@excalidraw/excalidraw` — stack architecture
- [x] `src/lib/diagram.ts` — couche invoke typée — convention AD-1
- [x] `src/components/workshop/ExcalidrawCanvas.tsx` — embed dynamic client-only — AD-9
- [x] `src/components/workshop/Toolbar.tsx` — bouton « Nouveau diagramme » — AC epic
- [x] `src/components/workshop/WorkshopLayout.tsx` + `CanvasArea.tsx` — flux create→load→embed, hint état vide — UX-DR12
- [x] `src/app/globals.css` — embed dimensionné dans zone canvas — layout 2.1

**Acceptance Criteria:**
- Given un Projet ouvert, when je clique « Nouveau diagramme », then un fichier `.fun/diagrams/<nom>.excalidraw` existe avec document Excalidraw vide.
- Given un diagramme ouvert dans l'embed, when j'utilise crayon, formes ou texte, then les éléments apparaissent sur le canvas sketch.
- Given aucun diagramme actif, when l'atelier s'affiche, then un hint « Nouveau diagramme » est visible dans la zone canvas.

## Spec Change Log

## Design Notes

Excalidraw attend `initialData` au format `{ elements, appState, files }` extrait du JSON fichier. Le wrapper parse le JSON retourné par `load_diagram` avant de le passer à l'embed. Pas de `onChange` persisté en 2.2 — l'état reste en mémoire React jusqu'à la story 2.3.

## Verification

**Commands:**
- `npm run lint` — expected: aucune erreur ESLint
- `npm run build` — expected: export static OK, pas d'erreur SSR Excalidraw
- `cargo check --manifest-path src-tauri/Cargo.toml` — expected: compile sans warning bloquant

**Manual checks (if no CLI):**
- `npm run tauri dev` : ouvrir un projet → « Nouveau diagramme » → fichier dans `.fun/diagrams/` → dessiner formes/crayon/texte visibles.

## Suggested Review Order

**Persistance diagramme (Rust)**

- Document Excalidraw vide canonique et nommage kebab-case auto
  [`diagram.rs:20`](../../src-tauri/src/project/diagram.rs#L20)

- Validation chemin sous `.fun/diagrams/` avant lecture disque
  [`diagram.rs:40`](../../src-tauri/src/project/diagram.rs#L40)

- Commandes Tauri exposées au WebView
  [`commands.rs:105`](../../src-tauri/src/commands.rs#L105)

**Flux frontend create → load → embed**

- Orchestration invoke create puis load avec parsing JSON
  [`diagram.ts:52`](../../src/lib/diagram.ts#L52)

- État atelier et gestion erreurs création diagramme
  [`WorkshopLayout.tsx:26`](../../src/components/workshop/WorkshopLayout.tsx#L26)

- Embed Excalidraw client-only sans SSR
  [`ExcalidrawCanvas.tsx:8`](../../src/components/workshop/ExcalidrawCanvas.tsx#L8)

**UI atelier**

- Bouton « Nouveau diagramme » dans la toolbar
  [`Toolbar.tsx:22`](../../src/components/workshop/Toolbar.tsx#L22)

- Hint état vide UX-DR12 dans la zone canvas
  [`CanvasArea.tsx:24`](../../src/components/workshop/CanvasArea.tsx#L24)

**Périphériques**

- Permissions ACL pour les nouvelles commandes
  [`app-commands.toml:26`](../../src-tauri/permissions/app-commands.toml#L26)

- Tests unitaires création et garde-fou chemin
  [`diagram.rs:108`](../../src-tauri/src/project/diagram.rs#L108)
