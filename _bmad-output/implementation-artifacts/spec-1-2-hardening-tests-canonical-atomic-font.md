---
title: 'Story 1.2 — Renforts : tests I/O, canonicalisation chemins, écriture atomique, Excalifont cartes'
type: feature
created: '2026-08-29'
status: 'done'
baseline_commit: 430e1d1cb705e3da232b4d9c9ed78fa06d42f56f
review_loop_iteration: 0
context:
  - _bmad-output/implementation-artifacts/epic-1-context.md
  - _bmad-output/implementation-artifacts/spec-1-2-home-recent-projects.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Fun-2026-08-29/DESIGN.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problème :** La Story 1.2 est marquée `done` mais laisse 5 trous identifiés lors des revues précédentes : aucun test automatisé sur les flux I/O accueil/recents, navigation `/workshop?path=` déjà en place mais non documentée comme AC, chemins recents non canonicalisés (doublons symlinks/spellings possibles), écriture du store JSON non atomique (risque de corruption au crash), et Excalifont déjà chargée globalement mais non vérifiée sur les cartes accueil.

**Approche :** Combler les 5 trous en un batch cohérent : (1) harnais de tests léger + 4 tests I/O React pour la matrice accueil/recents, (2) test Rust unit sur `recent.rs`, (3) canonicalisation realpath + dedup dans le store, (4) écriture atomique via fichier temporaire + rename, (5) vérification que les cartes héritent bien d'Excalifont — pas de nouveau CSS si l'héritage fonctionne.

## Boundaries & Constraints

**Always:**
- Persistance recents via commandes Tauri uniquement (AD-1).
- Microcopy française, ton calme (NFR-8).
- Tests dans le même style que le projet existant (pas de framework tiers complexe au MVP).
- Changer `recent.rs` et `commands.rs` uniquement pour la persistance ; ne pas toucher `HomeScreen` sauf si un test révèle un bug.
- Excalifont déjà déclarée dans `globals.css` — vérifier l'héritage CSS, pas ré-importer la police.

**Ask First:**
- Choix du framework de test React (Vitest vs Jest vs React Testing Library natif) — si le projet n'a aucune config test existante, proposer Vitest comme option par défaut et demander confirmation avant d'installer.
- Si l'écriture atomique nécessite un changement dans `touch_recent_project` qui pourrait affecter d'autres commandes, confirmer le scope.

**Never:**
- OpenRouter, Excalidraw, chat, diagrammes, Pomodoro.
- Refactor complet de `HomeScreen` ou `ProjectCard` — changer uniquement ce qui sert les tests ou la canonicalisation.
- Ajouter des dépendances lourdes (jest-circus, playwright, etc.) pour 4 tests simples.

## I/O & Edge-Case Matrix

|| Scenario | Input / State | Expected Output / Behavior | Error Handling |
||----------|--------------|---------------------------|----------------|
|| Accueil vide | `get_recent_projects` retour [] | Grille non affichée, message vide calme, CTA visibles | Aucun error state |
|| Recents chargés | Store JSON valide avec 1-3 projets | Cartes nom + chemin affichées, dernièreouvert triée | Liste vide si fichier absent → vu ci-dessus |
|| Clic carte | Path valide dans store | `invoke("open_project")` → navigation `/workshop?path=` | Path invalide : message erreur, pas de navigation |
|| Clic CTA dossier | `pick_project_folder` annulé | reste sur accueil, pas d'erreur, pas de navigation | Annulation = reste accueil |
|| Chemin canonical | Même dossier via symlink + path direct | 1 entrée dans store après dedup | Doublon éliminé à l'insertion |
|| Écriture atomique | Crash pendant `fs::write` store | Fichier ancien intact, pas de JSON tronqué | Réécriture échouée = données précédentes conservées |
|| Excalifont cartes | `ProjectCard` dans DOM | font-family calculée = `Excalifont, Virgil, "Segoe UI Emoji", sans-serif` | Fallback system sans-serif si police non chargée |

</frozen-after-approval>

## Code Map

- `src/app/page.tsx` — shell accueil (délegue à `HomeScreen`)
- `src/components/home/HomeScreen.tsx` — logique UI + invoke Tauri recents + navigation
- `src/components/home/ProjectCard.tsx` — carte projet (button, deux spans)
- `src/app/workshop/page.tsx` — atelier avec `searchParams.get("path")` déjà implémenté
- `src/app/globals.css` — chargement Excalifont + variable `--fun-typography-ui-family`
- `src-tauri/src/recent.rs` — store JSON recents (fs::write non atomique, pas de canonicalisation)
- `src-tauri/src/commands.rs` — commandes `get_recent_projects`, `touch_recent_project`, `open_project`
- `_bmad-output/planning-artifacts/ux-designs/ux-Fun-2026-08-29/DESIGN.md` — référence typo Excalifont (locus 28-44, 151)
- `_bmad-output/implementation-artifacts/spec-1-2-home-recent-projects.md` — spec originale Story 1.2 (référence AC)

## Tasks & Acceptance

**Execution:**
- [x] Configurer harnais de tests React (Vitest ou RTL natif selon ce qui est déjà présent) — installer dépendances si absentes, config minimale
- [x] Écrire 4 tests I/O React couvrant la matrice : état vide, recents affichés, clic carte → navigation attendue, clic CTA dossier → annulation gérée
- [x] Écrire 1 test Rust unit sur `recent.rs` : canonicalisation + écriture atomique + dedup (mock fs ou test sur tempdir)
- [x] Modifier `recent.rs` : canonicaliser les chemins entrant via `std::fs::canonicalize` avant insertion ; dédupliquer sur path canonique
- [x] Modifier `recent.rs` : écrire le store via fichier temporaire + `fs::rename` pour l'atomicité (si `cfg!(target_os)` le permet, sinon fallback documenté)
- [x] Vérifier que `ProjectCard` hérite bien d'`--fun-typography-ui-family` dans le CSS calculé (inspection ou test snapshot) — si non, corriger avec portée CSS minimale, pas de nouvelle police
- [x] Mettre à jour les AC de la spec originale `spec-1-2-home-recent-projects.md` pour documenter la navigation `/workshop?path=` déjà existante

**Acceptance Criteria:**
- Given lancement sans projet, when la page s'affiche, then le test "état vide" passe : message vide + CTA visibles sans error state.
- Given store JSON avec 2 projets, when la page charge, then le test "recents affichés" passe : cartes avec nom + chemin dans le DOM.
- Given clic sur une carte, when l'action se déclenche, then le test navigation passe : `invoke("open_project")` appelé avec le bon path, navigate vers `/workshop?path=`.
- Given clic CTA dossier suivi d'annulation du sélecteur, when l'utilisateur annule, then le test annulation passe : aucun appel à `open_project`, reste sur l'accueil.
- Given deux chemins pointing vers le même dossier (path direct + symlink), when le store est mis à jour, then le test dedup passe : une seule entrée dans le store après canonicalisation.
- Given un crash simulé pendant l'écriture du store, when l'opération échoue, then le test atomicité passe : le fichier store conserve les données précédentes intactes.
- Given `ProjectCard` rendu, when on inspecte le CSS calculé, then la police est `Excalifont, Virgil, "Segoe UI Emoji", sans-serif` (héritage de `--fun-typography-ui-family`).
- `npm run build` — expected: exit 0.

## Spec Change Log

## Design Notes

- Item 2 (navigation `/workshop?path=`) est déjà implémenté dans `workshop/page.tsx:18-34` — il n'y a rien à coder, juste à en faire un test et le documenter comme AC dans la spec originale.
- Item 5 (Excalifont) : la police est déjà chargée dans `globals.css:2-4` et la variable `--fun-typography-ui-family` est définie en `globals.css:47`. Les composants `HomeScreen` et `ProjectCard` n'ont pas de `font-family` hardcode — vérifier que l'héritage CSS fonctionne. Si oui, aucun changement de code nécessaire pour l'item 5.
- Écriture atomique : sur Linux/ macOS, `fs::write` sur un fichier temporaire suivi de `fs::rename` est l'approche standard. Vérifier que `recent.rs` utilise `STORE_FILE` comme nom de fichier final.

## Verification

**Commands:**
- `npm run build` — expected: exit 0
- `cargo test` (ou `cargo test recent`) — expected: test unit `recent.rs` passe
- `npm test` (ou équivalent Vitest) — expected: 4 tests React I/O passent

**Manual checks:**
- Inspecter un `ProjectCard` rendu dans le navigateur : computed font-family = Excalifont.
- Ouvrir le store JSON des recents après navigation via symlink + path direct : 1 entrée unique.
- Simuler un arrêt brutal pendant `touch_recent_project` (kill -9 sur le process) : vérifier que le fichier store n'est pas corrompu.

## Suggested Review Order

**Canonicalisation & dédup**

- Point d'entrée : `canonicalize_safe` gère les symlinks et les paths manquants sans crasher
  [`recent.rs:42`](../../src-tauri/src/recent.rs#L42)
- Logique de dédup dans `touch_recent_project` : comparaison sur path canonique
  [`recent.rs:100`](../../src-tauri/src/recent.rs#L100)

**Écriture atomique**

- Write tmp + rename avec cleanup du fichier orphelin en cas d'échec
  [`recent.rs:51`](../../src-tauri/src/recent.rs#L51)

**Tests Rust**

- 9 tests couvrant canonicalize, roundtrip, atomicité, dedup, edge cases
  [`recent.rs:133`](../../src-tauri/src/recent.rs#L133)

**Harness React**

- Config vitest avec alias `@` et environment jsdom
  [`vitest.config.ts:1`](../../vitest.config.ts#L1)
- 4 tests I/O : état vide, recents, clic carte, annulation CTA
  [`home-screen.test.tsx:1`](../../src/test/home-screen.test.tsx#L1)

**Dépendances**

- `tempfile` en dev-dependencies Rust
  [`Cargo.toml:24`](../../src-tauri/Cargo.toml#L24)
- `vitest` + `@testing-library/*` en dev-dependencies JS
  [`package.json:21`](../../package.json#L21)

**Spec originale**

- AC mis à jour : navigation `/workshop?path=` documentée
  [`spec-1-2-home-recent-projects.md:66`](spec-1-2-home-recent-projects.md#L66)
