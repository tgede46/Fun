---
title: 'Story 4.1 — Configurer les durées Pomodoro'
type: feature
created: '2026-08-29'
status: done
baseline_commit: NO_VCS
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/epic-3-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le Pomodoro existe comme concept (FR-7) mais les durées de travail et de pause ne sont pas configurables — l'utilisateur est bloqué sur 25/5 minutes sans pouvoir adapter au timer à son rythme.

**Approach:** Chip Pomodoro dans la toolbar affiche un bouton de configuration. L'UI de config permet de saisir les deux durées (minutes). Les durées sont persistées dans `.fun/settings.json` via `set_pomodoro_durations`. La lecture se fait via `get_project_settings`.

## Boundaries & Constraints

**Always:**
- Persistance via `.fun/settings.json` uniquement (FR-7, AD-4) — pas de store React ou localStorage.
- Validation : durées > 0, max raisonnable (ex. 120 min) pour éviter les absurdités.
- Default : 25 min travail / 5 min pause si pas de settings (déjà dans `ProjectSettings::default()`).
- Accessible depuis le chip Pomodoro en atelier — pas de navigation vers un écran séparé.

**Ask First:**
- Aucun.

**Never:**
- Modifier les durées sans les persister (settings.json).
- Exposer les durées dans le WebView sans passer par Tauri.

## I/O & Edge-Case Matrix

|| Scenario | Input / State | Expected Output / Behavior | Error Handling |
||----------|--------------|---------------------------|----------------|
|| Configuration | Saisie durées valides | `set_pomodoro_durations` écrit dans settings.json | Erreur disque → message UI |
|| Lecture au montage | Projet ouvert | Chip affiche les durées persistrées ou default 25/5 | N/A |
|| Valeurs absurdes | 0 min ou > 120 min | Validation UI refuse + message | N/A |
|| Aucun settings | `.fun/settings.json` absent | Defaults 25/5 utilisés | N/A |
|| Changement pendant timer actif | Timer en cours | Les nouvelles durées s'appliquent au prochain cycle | Comportement à décider |

</frozen-after-approval>

## Code Map

- `src-tauri/src/project/settings.rs` — `ProjectSettings` (ligne 38) : `pomodoro_work_minutes`, `pomodoro_break_minutes`. Déjà défaut 25/5.
- `src-tauri/src/project/settings.rs` — `read_settings()` (ligne 60) : lecture du fichier.
- `src-tauri/src/project/settings.rs` — `write_settings()` (ligne 74) : écriture du fichier.
- `src-tauri/src/notify.rs` — `set_pomodoro_durations()` (ligne 17) : commande Tauri existante, appelle `settings::set_pomodoro_durations()`.
- `src-tauri/src/commands.rs` — `get_project_settings()` (ligne 180) : retourne les durées + thème. `set_project_theme` existe, `set_pomodoro_durations` est dans notify.rs.
- `src-tauri/src/lib.rs` — `set_pomodoro_durations` déjà enregistrée dans `invoke_handler` (ligne 47).
- `src/components/workshop/PomodoroChip.tsx` — **new** : chip Pomodoro avec affichage durées, bouton config, timer.
- `src/components/workshop/WorkshopLayout.tsx` — **update** : intégrer `PomodoroChip`.
- `src/lib/settings.ts` — **new** : helpers `invoke('get_project_settings')` et `invoke('set_pomodoro_durations')`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/components/workshop/PomodoroChip.tsx` — chip affiché en atelier avec durées actuelles, bouton « Config » ouvrant un small panel de saisie.
- [ ] `src/components/workshop/PomodoroChip.tsx` — panel config : deux champs (travail, pause) en minutes, validation > 0 et max 120, bouton « Enregistrer ».
- [ ] `src/lib/settings.ts` — helpers TypeScript pour `get_project_settings` et `set_pomodoro_durations`.
- [ ] `WorkshopLayout.tsx` — charger les durées au montage, passer au chip.
- [ ] Vérifier que `set_pomodoro_durations` est bien enregistrée dans les permissions Tauri.

**Acceptance Criteria:**
- Given le chip Pomodoro en atelier, when l'utilisateur clique pour configurer, then il peut saisir les durées travail et pause.
- Given des durées modifiées, when l'utilisateur les enregistre, then elles sont persistées dans `.fun/settings.json`.
- Given un projet rouvert, when le chip se charge, then il affiche les durées persistrées (ou 25/5 par défaut).

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` — expected: exit 0
- `npm run build` — expected: exit 0
- `cargo test --lib project::settings` — expected: tests existants passent

**Manual checks:**
- `npm run tauri dev` : ouvrir un projet, cliquer sur config Pomodoro, changer les durées, vérifier que le fichier `.fun/settings.json` est mis à jour.
- Rouvrer le projet — les nouvelles durées sont affichées dans le chip.

## Suggested Review Order

**UI chip Pomodoro**
- Point d'entrée : chip toolbar, panel config, binding invoke.
  [`PomodoroChip.tsx`](../../src/components/workshop/PomodoroChip.tsx)

**Persistance Rust**
- `set_pomodoro_durations` déjà existant dans `notify.rs`.
  [`notify.rs:17`](../../src-tauri/src/notify.rs#L17)

**Helpers frontend**
- `settings.ts` — wrappers invoke pour les deux commandes.
  [`settings.ts`](../../src/lib/settings.ts)
