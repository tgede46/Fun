---
title: 'Story 2.5 — Thème sombre électrique (test workflow)'
type: feature
created: '2026-08-30'
status: done
baseline_commit: 7f970072adc56137d1b35e15c9de6bc56928a3ef
spec_slug: 2-5-electro-dark-theme
---

<frozen-after-approval reason="human-owned intent">

## Intent

**Problem:** L'application Fun utilise Segoe UI partout. Le thème sombre actuel est juste un invert gris, pas assez contrasté pour les heures tardives.

**Approach:** Introduire un thème "électro" sombre avec couleurs plus vives (#0a0a1a background, #00d4ff accents cyan), toggle dans la barre latérale, persistance dans `.fun/settings.json`.

## Boundaries & Constraints

**Always:**
- Respecter les tokens de design existants dans `globals.css`
- Préserver la palette claire actuelle comme thème par défaut
- Persister le choix dans `.fun/settings.json`

**Never:**
- Modifier les autres featurse du workshop
- Utiliser des couleurs qui réduisent le contraste AA

</frozen-after-approval>

## Code Map

- `src/app/globals.css` — tokens `[data-fun-theme="electro"]` (#0a0a1a / #00d4ff)
- `src/lib/theme.ts` — `FunTheme` + cycle light → dark → electro
- `src/components/workshop/ThemeToggle.tsx` — bouton cycle (toolbar, pas sidebar)
- `src/components/workshop/Toolbar.tsx` — intégration du toggle
- `src/components/workshop/WorkshopLayout.tsx` — `data-fun-theme` + persistance
- `src/lib/settings.ts` / `src-tauri/src/project/settings.rs` — `theme` dans `.fun/settings.json`

## Tasks & Acceptance

**Execution:**
- [x] Tokens CSS électro (#0a0a1a, accents #00d4ff) sans casser le thème clair
- [x] Cycle toggle clair → sombre → électro dans la toolbar
- [x] Persistance `theme: electro` via `set_project_theme` / `settings.json`
- [x] Test Rust persistance électro + test React cycle toggle

**Acceptance Criteria:**
- Given atelier ouvert, when le toggle atteint électro, then fond `#0a0a1a` et accent `#00d4ff`.
- Given thème électro enregistré, when l'atelier recharge, then `settings.json` conserve `electro`.
- Given thème clair, when aucun champ custom, then le beige par défaut reste inchangé.

## Spec Change Log

- 2026-09-10 — Clôture : implémentation déjà en place ; spec passée `done`.

## Verification

**Commands:**
- `cargo test set_theme_electro --manifest-path src-tauri/Cargo.toml` — expected: exit 0
- `npx vitest run src/test/theme-toggle.test.tsx` — expected: exit 0

**Manual checks:**
- Toolbar : clair → sombre → électro → clair ; rouvrir l'atelier conserve électro.

## Suggested Review Order

- Tokens électro
  [`globals.css:61`](../../src/app/globals.css#L61)
- Cycle et tokens TS
  [`theme.ts:1`](../../src/lib/theme.ts#L1)
- Toggle toolbar
  [`ThemeToggle.tsx:9`](../../src/components/workshop/ThemeToggle.tsx#L9)
- Persistance Rust
  [`settings.rs:10`](../../src-tauri/src/project/settings.rs#L10)
