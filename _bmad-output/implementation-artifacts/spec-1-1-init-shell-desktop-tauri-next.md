---
title: 'Story 1.1 — Shell desktop Tauri + Next.js'
type: feature
created: '2026-08-29'
status: done
baseline_commit: NO_VCS
review_loop_iteration: 0
context:
  - _bmad-output/implementation-artifacts/epic-1-context.md
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Fun n'a pas encore de code application — seulement les artifacts BMAD. Il faut un shell desktop exécutable pour valider la stack Tauri + Next.js avant d'ajouter Projet, canvas ou IA.

**Approach:** Scaffolder Next.js (App Router, TypeScript) avec export statique, initialiser Tauri 2, configurer le couplage officiel (out/, devUrl), et afficher une page d'accueil minimale « Fun » prouvant que la fenêtre desktop charge l'UI.

## Boundaries & Constraints

**Always:**
- Next.js `output: 'export'` ; pas de Server Actions, API routes, ni SSR au MVP (AD-9).
- `src-tauri/tauri.conf.json` : `frontendDist` = `../out`, `beforeDevCommand` / `beforeBuildCommand` alignés sur npm.
- Identifiant Tauri : `com.fun.app` (ou équivalent reverse-DNS stable).
- Aucun appel OpenRouter, aucun accès fs depuis `src/` — shell UI seulement (AD-1).

**Ask First:**
- Changement de package manager (npm vs pnpm) si conflit avec l'environnement local.
- Version exacte Next.js si create-next-app propose une major plus récente que 14.x.

**Never:**
- Implémenter open_project, Excalidraw, chat, Pomodoro (stories suivantes).
- Ajouter backend Spring/GCP.
- Commiter clés API ou `.env` avec secrets.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Dev launch | `npm run tauri dev` (ou script équivalent) | Fenêtre desktop s'ouvre, UI Next visible | Erreur build affichée en terminal ; pas de crash silencieux |
| Static build | `npm run build` puis `cargo tauri build` (smoke) | `out/` généré sans erreur SSR | Échec build si config export incorrecte |
| Home render | App démarre | Titre « Fun » + message accueil placeholder visible | Page blanche = échec |

</frozen-after-approval>

## Code Map

- `(greenfield)` — pas de `package.json` ni `src-tauri/` à ce jour ; création from scratch à la racine `/home/gedeonkp/Documents/projet/Fun/`.
- `_bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md` — AD-1, AD-9, structural seed (read-only).
- `_bmad-output/planning-artifacts/epics.md` — Story 1.1 AC source (read-only).

## Tasks & Acceptance

**Execution:**
- [x] `package.json` — scripts `dev`, `build`, `tauri` ; dépendances Next + React + `@tauri-apps/api` — base tooling
- [x] `next.config.ts` — `output: 'export'`, `images.unoptimized: true`, `assetPrefix` dev Tauri — AD-9
- [x] `src/app/page.tsx` — page accueil minimale « Fun » — preuve UI
- [x] `src/app/layout.tsx` — layout root HTML — shell Next
- [x] `src-tauri/tauri.conf.json` — build dev/prod, `frontendDist: ../out` — couplage Tauri
- [x] `src-tauri/src/lib.rs` + `main.rs` — app Tauri 2 minimale — runtime desktop
- [x] `src-tauri/Cargo.toml` — deps tauri 2 — compile Rust
- [x] `.gitignore` — node_modules, out, target, .env — hygiène repo

**Acceptance Criteria:**
- Given le repo cloné et deps installées, when je lance `npm run tauri dev`, then une fenêtre desktop s'ouvre avec la page Fun visible.
- Given `next.config`, when je lance `npm run build`, then le dossier `out/` est produit sans erreur liée au SSR.
- Given le code dans `src/`, when je cherche `fetch(` vers openrouter ou imports `fs`, then aucune occurrence n'existe.

## Spec Change Log

## Design Notes

Configuration Next + Tauri d'après la doc officielle Tauri 2 / Next.js : dev server sur :3000, export statique vers `out/` en production embarquée.

## Verification

**Commands:**
- `npm install` — expected: exit 0
- `npm run build` — expected: dossier `out/` créé
- `npm run tauri dev` — expected: fenêtre Fun (manual smoke ; peut nécessiter display/GPU)

**Manual checks (if no CLI):**
- Vérifier `next.config` contient `output: 'export'`.
- Vérifier `tauri.conf.json` pointe `frontendDist` vers `../out`.
- Linux : installer deps Tauri (`webkit2gtk4.1`, `gtk3`, etc.) avant `npm run tauri dev`.

## Suggested Review Order

- Export statique Next pour embarquement Tauri (AD-9)
  [`next.config.ts:6`](../../next.config.ts#L6)

- Couplage build dev/prod vers `out/`
  [`tauri.conf.json:6`](../../src-tauri/tauri.conf.json#L6)

- Page d'accueil placeholder Fun
  [`page.tsx:3`](../../src/app/page.tsx#L3)

- Runtime Tauri 2 minimal + shell plugin
  [`lib.rs:3`](../../src-tauri/src/lib.rs#L3)

- Scripts npm et dépendances stack
  [`package.json:5`](../../package.json#L5)
