---
title: 'Story 2.3 — Sauvegarder et recharger un diagramme'
type: feature
created: '2026-08-29'
status: done
baseline_commit: 45df67ea5fa7422bf80ea96a603249ecb911f2ad
review_loop_iteration: 0
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/spec-2-2-create-diagram-excalidraw-embed.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les dessins restent en mémoire React — fermer ou rouvrir le projet perd le travail. Aucune commande `save_diagram` ni sélection d'un diagramme existant.

**Approach:** Ajouter `save_diagram` et `list_diagrams` côté Tauri ; debounce ~800 ms sur `onChange` Excalidraw pour persister le JSON ; liste cliquable des `.excalidraw` dans l'atelier pour recharger via `load_diagram` existant.

## Boundaries & Constraints

**Always:**
- Écritures uniquement sous `project_root/.fun/diagrams/` via `save_diagram` (AD-4, AD-5).
- Réutiliser `validate_diagram_path` pour save et load.
- JSON sauvegardé au format Excalidraw canonique (`type: excalidraw`, `version: 2`).
- Debounce 800 ms ; ignorer le premier `onChange` après chargement (pas de save fantôme).
- Tracker `activeDiagramPath` pour cibler le fichier en cours.
- Liste diagrammes : nom fichier sans extension, tri par date modif décroissante.

**Ask First:**
- Aucun.

**Never:**
- Toggle thème embed (Story 2.4).
- Reset diagramme (Story ultérieure FR-5).
- Écrire hors `.fun/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sauvegarde auto | Dessin modifié, debounce écoulé | `save_diagram` écrit le JSON sur disque | Log console / indicateur discret si échec |
| Rechargement | Clic diagramme dans la liste | `load_diagram` → embed remonté avec contenu | Message UI si échec |
| Liste au load | Projet avec N diagrammes | N entrées affichées dans l'atelier | Liste vide si aucun |
| Save chemin invalide | `diagram_path` hors `.fun/diagrams/` | Refus Rust | Erreur invoke |
| JSON invalide save | Contenu non Excalidraw | Refus Rust | Erreur invoke |
| Switch diagramme | Sélection autre fichier | Save debounced du précédent flush ; nouveau diagramme chargé | N/A |

</frozen-after-approval>

## Code Map

- `src-tauri/src/project/diagram.rs` — **update** : `save_diagram()`, `list_diagrams()` ; réutiliser `validate_diagram_path`
- `src-tauri/src/commands.rs` — **update** : handlers `save_diagram`, `list_diagrams`
- `src-tauri/src/lib.rs` + permissions — enregistrer commandes
- `src/lib/diagram.ts` — **update** : `saveDiagram`, `listDiagrams`, `serializeExcalidrawScene`
- `src/components/workshop/ExcalidrawCanvas.tsx` — **update** : `onChange` debounced + `diagramPath` key remount
- `src/components/workshop/DiagramList.tsx` — **new** : liste cliquable des diagrammes
- `src/components/workshop/WorkshopLayout.tsx` — **update** : `activeDiagramPath`, load list au mount, orchestration save/select
- `src/components/workshop/CanvasArea.tsx` — **update** : intégrer `DiagramList`, passer props save
- `src/app/globals.css` — styles liste diagrammes

## Tasks & Acceptance

**Execution:**
- [x] `diagram.rs` — save + list + tests
- [x] `commands.rs` + permissions — exposer commandes
- [x] `diagram.ts` — helpers invoke + serialization
- [x] `ExcalidrawCanvas.tsx` — debounced save
- [x] `DiagramList.tsx` + `WorkshopLayout.tsx` + `CanvasArea.tsx` — liste et rechargement
- [x] `globals.css` — styles liste

**Acceptance Criteria:**
- Given un diagramme modifié, when debounce déclenche, then le JSON est écrit dans `.fun/diagrams/`.
- Given un Projet rouvert, when je sélectionne un diagramme existant, then le contenu sauvegardé se recharge dans l'embed.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` — OK
- `npm run build` — OK
- `cargo test --manifest-path src-tauri/Cargo.toml project::diagram` — OK

**Manual checks:**
- `npm run tauri dev` : dessiner → rouvrir projet → sélectionner diagramme → dessin visible.

## Suggested Review Order

**Persistance Rust**

- Écriture JSON validée et liste triée par date modif
  [`diagram.rs:102`](../../src-tauri/src/project/diagram.rs#L102)

- Commandes `save_diagram` et `list_diagrams`
  [`commands.rs:132`](../../src-tauri/src/commands.rs#L132)

**Sauvegarde debounced**

- Debounce 800 ms avec skip initial et flush au démontage
  [`ExcalidrawCanvas.tsx:90`](../../src/components/workshop/ExcalidrawCanvas.tsx#L90)

**Rechargement UI**

- Liste cliquable et orchestration atelier
  [`WorkshopLayout.tsx:41`](../../src/components/workshop/WorkshopLayout.tsx#L41)

- Intégration liste + embed dans la zone canvas
  [`CanvasArea.tsx:28`](../../src/components/workshop/CanvasArea.tsx#L28)

**Périphériques**

- Tests save/list/path guard
  [`diagram.rs:220`](../../src-tauri/src/project/diagram.rs#L220)
