# Epic 1 Context: Lancer Fun et ouvrir un Projet

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre à Gedeonkp de lancer Fun comme application desktop, voir l'écran d'accueil, ouvrir un dossier local comme Projet et accéder à l'atelier avec la structure `.fun/` initialisée. C'est la fondation sans laquelle canvas, IA et Pomodoro ne peuvent pas exister.

## Stories

- Story 1.1: Initialiser le shell desktop Tauri + Next.js
- Story 1.2: Écran Accueil et projets récents
- Story 1.3: Ouvrir un dossier et initialiser `.fun/`
- Story 1.4: Lister les diagrammes du Projet

## Requirements & Constraints

- Application desktop PC uniquement (pas mobile v1).
- Next.js en export statique (`output: 'export'`) — pas de SSR ni API routes Next.
- WebView isolée : pas d'accès direct au filesystem ni à OpenRouter depuis le frontend React ; la plateforme passera par des commands Tauri (AD-1).
- Projet = dossier local ouvert ; artifacts Fun sous `.fun/` uniquement (stories 1.3+).
- Microcopy future en français.

## Technical Decisions

- Stack : Tauri 2.x + Next.js 14+ (App Router) + React 18+.
- `frontendDist` = `out/` ; dev via `cargo tauri dev` avec `devUrl` localhost:3000.
- Structure seed : `src/` (Next UI), `src-tauri/` (Rust), commands en `snake_case`.
- Pas de backend GCP au MVP.

## UX & Interaction Patterns

- Écran Accueil (story 1.2) : projets récents, CTA « Ouvrir un dossier », grille max ~720px.
- Story 1.1 ne livre que le shell minimal prouvant que la fenêtre desktop s'ouvre.

## Cross-Story Dependencies

- 1.1 → 1.2 → 1.3 → 1.4 (ordre séquentiel).
- Epic 2 (canvas) dépend de 1.3 minimum pour ouvrir un Projet.
