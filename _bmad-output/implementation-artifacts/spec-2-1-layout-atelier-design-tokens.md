---
title: 'Story 2.1 — Layout atelier et design tokens'
type: feature
created: '2026-08-29'
status: done
baseline_commit: NO_VCS
review_loop_iteration: 0
context:
  - _bmad-output/implementation-artifacts/epic-1-context.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Fun-2026-08-29/DESIGN.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'atelier (`/workshop`) est un placeholder sans layout structuré. Les tokens DESIGN.md (couleurs, typo, spacing) ne sont pas appliqués — `globals.css` utilise `--fun-*` variables partielles et la typo `Segoe UI` au lieu d'Excalifont.

**Approach:** Créer les composants layout atelier (Toolbar, ModeRail, CanvasArea, ChatSidebar, WorkshopLayout) avec les tokens DESIGN.md ; migrer `globals.css` vers les variables complètes (couleurs light/dark, typo Excalifont, spacing, rounded) ; le canvas occupe ≥60% largeur hors chat.

## Boundaries & Constraints

**Always:**
- Layout : toolbar 48px haut, rail 48px gauche, canvas flex中央, chat 320px droite (UX-DR3, NFR-10).
- Thème clair beige/noir appliqué par défaut (UX-DR1, UX-DR5).
- Excalifont pour toute l'UI (corps 16px) (UX-DR2).
- Fenêtre minimum 1024×640 (NFR-10).
- Conserver les classes `.workshop-*` existantes dans `globals.css` pour compatibilité.

**Ask First:**
- Aucun.

**Never:**
- Modifier les tokens DESIGN.md (source de vérité).
- Ajouter chat fonctionnel, canvas dessin, ou Pomodoro (stories suivantes).
- Exposer clés API ou secrets.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Atelier load | Projet ouvert via `/workshop?path=...` | Layout 4 zones visible | Redirect accueil si pas de path |
| Resize window | User resize | Canvas flex s'adapte, min 1024×640 | Pas de overflow |
| Thème par défaut | Premier lancement | Beige fond, noir texte | N/A |
| Excalifont manquante | Police non chargée | Fallback system sans-serif | Pas de crash |

</frozen-after-approval>

## Code Map

- `src/app/globals.css` — tokens CSS existants (`--fun-*`) + styles `.workshop-*` ; **update** vers tokens DESIGN.md complets
- `src/app/workshop/page.tsx` — route atelier placeholder ; **update** vers WorkshopLayout
- `src/app/layout.tsx` — layout root existant (read-only)
- `src/components/workshop/WorkshopLayout.tsx` — grille atelier orchestration (**new**)
- `src/components/workshop/Toolbar.tsx` — toolbar hauteur 48px (**new**)
- `src/components/workshop/ModeRail.tsx` — rail gauche 48px icônes (**new**)
- `src/components/workshop/CanvasArea.tsx` — zone canvas flex central (**new**)
- `src/components/workshop/ChatSidebar.tsx` — sidebar chat 320px (**new**)
- `src/lib/theme.ts` — utility thème clair/sombre (**new**)
- `_bmad-output/planning-artifacts/ux-designs/ux-Fun-2026-08-29/DESIGN.md` — tokens source (read-only)

## Tasks & Acceptance

**Execution:**
- [x] `globals.css` — ajouter variables CSS DESIGN.md complètes (`--fun-canvas-*`, `--fun-surface-*`, `--fun-foreground-*`, `--fun-accent-*`, `--fun-border-*`, `--fun-overlay-*`, `--fun-radius-*`, `--fun-spacing-*`, `--fun-typography-*`) ; migrer font-family vers Excalifont ; garder variables `--fun-*` existantes pour compatibilité accueil
- [x] `src/components/workshop/WorkshopLayout.tsx` — CSS grid : `[toolbar 48px] [rail 48px | canvas flex | chat 320px]` ; hauteur 100vh ; fond `--fun-surface-base-light`
- [x] `src/components/workshop/Toolbar.tsx` — hauteur 48px, fond `--fun-surface-base-light`, bordure bas `--fun-border-light`, placeholder « Toolbar »
- [x] `src/components/workshop/ModeRail.tsx` — largeur 48px, icônes Sketch/UML placeholder, fond `--fun-surface-base-light`
- [x] `src/components/workshop/CanvasArea.tsx` — flex-grow, fond `--fun-canvas-light` (#FFFFFF), placeholder « Canvas » centré
- [x] `src/components/workshop/ChatSidebar.tsx` — largeur 320px, fond `--fun-surface-raised-light`, bordure gauche `--fun-border-light`, placeholder « Chat »
- [x] `src/app/workshop/page.tsx` — remplacer placeholder par `<WorkshopLayout>` ; garder logique `open_project` et états loading/error
- [x] `src/lib/theme.ts` — utility `getThemeTokens(theme)` retournant les variables CSS pour clair/sombre

**Acceptance Criteria:**
- Given un Projet ouvert, when atelier s'affiche, then toolbar 48px, rail 48px, canvas flex中央, chat 320px visibles.
- Given tokens DESIGN.md, when atelier rend UI, then thème clair beige/noir appliqué par défaut.
- Given Excalifont, when UI chrome s'affiche, then typo Excalifont corps 16px utilisée.
- Given resize window, when canvas s'adapte, then canvas reste ≥60% largeur hors chat.

## Spec Change Log

## Design Notes

La grille atelier suit le layout Excalidraw reference : toolbar en haut, rail gauche pour modes, canvas central dominant, sidebar droite pour chat/props. Les tokens CSS replicent exactement les valeurs du DESIGN.md frontmatter.

## Verification

**Commands:**
- `npm run build` — expected: exit 0

**Manual checks:**
- Vérifier `/workshop?path=<test>` affiche le layout 4 zones.
- Vérifier fond beige (#F5F0E8), texte noir (#1A1A1A) — thème clair.
- Vérifier Excalifont chargée (inspect element → computed font-family).
- Vérifier canvas ≥60% largeur avec chat ouvert (320px sidebar).
