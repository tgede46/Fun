---
title: 'Story 2.4 — Toggle thème clair / sombre'
type: feature
created: '2026-08-29'
status: done
baseline_commit: 9a89b995320e556f802b34c1c70a590efab45c6e
review_loop_iteration: 0
context:
  - _bmad-output/planning-artifacts/ux-designs/ux-Fun-2026-08-29/DESIGN.md
  - _bmad-output/implementation-artifacts/spec-2-1-layout-atelier-design-tokens.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'atelier reste en thème clair fixe ; pas de toggle ni persistance de préférence par Projet.

**Approach:** Bouton toggle dans la toolbar ; bascule `data-fun-theme` sur le shell atelier (variables CSS DESIGN.md) ; persistance `theme` dans `.fun/settings.json` via commandes Tauri ; sync thème embed Excalidraw.

## Boundaries & Constraints

**Always:**
- Thèmes : clair beige/noir, sombre noir/beige (UX-DR1, UX-DR10).
- Défaut `light` si champ absent dans `settings.json` existant.
- Toggle visible uniquement dans l'atelier (toolbar).
- Réutiliser tokens `--fun-*-light/dark` déjà dans `globals.css`.

**Ask First:**
- Aucun.

**Never:**
- Modifier DESIGN.md.
- Thème global accueil (hors scope atelier).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Toggle thème | Clic bouton toolbar | UI atelier bascule clair ↔ sombre | N/A |
| Persistance | Changement thème | `settings.json` mis à jour (`theme: light\|dark`) | Message UI si échec |
| Load atelier | Projet avec theme dark | Atelier s'ouvre en sombre | Fallback light |
| settings.json legacy | Sans champ `theme` | Traité comme `light` | N/A |

</frozen-after-approval>

## Code Map

- `src-tauri/src/project/settings.rs` — **new** : read/write `settings.json` + champ `theme`
- `src-tauri/src/project/init.rs` — default `theme: light` dans settings
- `src-tauri/src/commands.rs` — `get_project_settings`, `set_project_theme`
- `src/lib/settings.ts` — invoke helpers
- `src/lib/theme.ts` — `applyWorkshopTheme`, réutiliser `getThemeTokens`
- `src/app/globals.css` — règles `[data-fun-theme="dark"]` sur `.workshop-shell`
- `src/components/workshop/Toolbar.tsx` — bouton toggle
- `src/components/workshop/WorkshopLayout.tsx` — load/save theme state
- `src/components/workshop/ExcalidrawCanvas.tsx` — prop `theme` Excalidraw

## Tasks & Acceptance

**Execution:**
- [x] Rust settings + commandes + permissions
- [x] CSS dark variant workshop shell
- [x] Toolbar toggle + WorkshopLayout persistence
- [x] Excalidraw theme sync

**Acceptance Criteria:**
- Given atelier ouvert, when toggle cliqué, then UI bascule beige/noir ↔ noir/beige.
- Given Projet ouvert, when thème changé, then préférence persistée dans `.fun/settings.json`.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` / `npm run build` / `cargo test` — OK

**Manual checks:**
- Toggle → visuel sombre ; rouvrir atelier → thème conservé.

## Suggested Review Order

**Persistance settings**

- Lecture/écriture `theme` dans settings.json avec défaut light
  [`settings.rs:59`](../../src-tauri/src/project/settings.rs#L59)

- Commandes `get_project_settings` / `set_project_theme`
  [`commands.rs:179`](../../src-tauri/src/commands.rs#L179)

**UI atelier**

- Toggle toolbar et attribut `data-fun-theme` sur le shell
  [`WorkshopLayout.tsx:128`](../../src/components/workshop/WorkshopLayout.tsx#L128)

- Variables CSS sombres scoping atelier
  [`globals.css:69`](../../src/app/globals.css#L69)

- Sync thème embed Excalidraw
  [`ExcalidrawCanvas.tsx:124`](../../src/components/workshop/ExcalidrawCanvas.tsx#L124)
