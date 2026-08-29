---
title: 'Story 1.2 — Écran Accueil et projets récents'
type: feature
created: '2026-08-29'
status: done
baseline_commit: NO_VCS
review_loop_iteration: 0
context:
  - _bmad-output/implementation-artifacts/epic-1-context.md
  - _bmad-output/implementation-artifacts/spec-1-1-init-shell-desktop-tauri-next.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'accueil actuel est un placeholder sans projets récents ni action pour ouvrir un dossier.

**Approach:** Écran Accueil conforme UX-DR4/12 : grille max 720px, cartes projet (nom + chemin), CTA « Ouvrir un dossier », persistance des recents côté Tauri ; navigation vers atelier placeholder (`.fun/` = story 1.3).

## Boundaries & Constraints

**Always:**
- Persistance recents via commandes Tauri uniquement (AD-1).
- Microcopy français, ton calme (NFR-8).
- Pas de création `.fun/` ni list diagrams (stories 1.3–1.4).

**Ask First:** Aucun.

**Never:**
- OpenRouter, Excalidraw, chat.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Accueil vide | Aucun recent | CTA + message calme | Pas d'erreur |
| Recents | JSON app data | Cartes nom + chemin | Liste vide si fichier absent |
| Ouvrir dossier | Clic CTA | Dialog natif → atelier si choisi | Annulation = reste accueil |
| Clic carte | Path connu | Atelier placeholder | Path invalide : message |

</frozen-after-approval>

## Code Map

- `src/app/page.tsx` — shell accueil
- `src/components/home/HomeScreen.tsx` — logique UI + invoke Tauri
- `src/components/home/ProjectCard.tsx` — carte projet
- `src/app/workshop/page.tsx` — atelier placeholder
- `src-tauri/src/recent.rs` — persistance recents
- `src-tauri/src/commands.rs` — commandes Tauri
- `src-tauri/src/lib.rs` — plugins + handlers

## Tasks & Acceptance

**Execution:**
- [x] Commands Tauri `get_recent_projects`, `pick_project_folder`, recents store
- [x] Plugin dialog Tauri + permissions
- [x] `HomeScreen` grille 720px, cartes, CTA, état vide
- [x] Route `/workshop` placeholder avec path projet
- [x] Styles beige/noir cohérents DESIGN

**Acceptance Criteria:**
- Given lancement sans projet, when accueil s'affiche, then grille centrée + CTA « Ouvrir un dossier ».
- Given recents en store, when accueil charge, then cartes nom + chemin visibles.
- Given clic carte ou dossier choisi, when navigation, then atelier affiche le projet via `/workshop?path=<encoded-path>` (navigation déjà implémentée dans `workshop/page.tsx`).
- Given aucun recent, when accueil, then état vide calme.

## Verification

**Commands:**
- `npm run build` — expected: exit 0
- `npx vitest run` — expected: 4 React I/O tests pass
- `cargo test --lib recent` — expected: 9 Rust unit tests pass

## Suggested Review Order

**Orchestration accueil**

- Point d'entrée : chargement recents, CTA dossier, navigation atelier.
  [`HomeScreen.tsx:18`](../../src/components/home/HomeScreen.tsx#L18)

- Carte projet cliquable nom + chemin.
  [`ProjectCard.tsx:9`](../../src/components/home/ProjectCard.tsx#L9)

**Persistance Tauri (AD-1)**

- Store JSON recents, validation dossier, purge chemins invalides.
  [`recent.rs:64`](../../src-tauri/src/recent.rs#L64)

- Commandes invoke exposées au frontend.
  [`commands.rs:5`](../../src-tauri/src/commands.rs#L5)

**Styles**

- Thème beige/noir, grille max 720px.
  [`globals.css:31`](../../src/app/globals.css#L31)
