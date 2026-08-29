---
title: 'Story 4.2 — Timer, cycles et notifications OS'
type: feature
created: '2026-08-29'
status: pending
baseline_commit: NO_VCS
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/epic-3-context.md
  - _bmad-output/implementation-artifacts/spec-4-1-config-durees-pomodoro.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les durées sont configurables mais il n'y a pas de timer fonctionnel — l'utilisateur ne peut pas lancer un Pomodoro, voir le compte à rebours, recevoir une notification à la fin de la phase, ni enchaîner les cycles.

**Approach:** Le chip Pomodoro expose un timer avec état (travail / pause / idle), un compte à rebours visuel, et un bouton Démarrer/Reprendre/Arrêter. À la fin de chaque phase, Tauri envoie une notification OS via `notify_pomodoro_phase`. Le cycle suivant démarre automatiquement. Le timer est état React (WebView), les notifications et la persistance des durées passent par Tauri.

## Boundaries & Constraints

**Always:**
- Notifications OS via `notify_pomodoro_phase` Tauri (FR-7) — pas de notification inline seule.
- Cycle automatique : travail → pause → travail → pause… sans redémarrage manuel (FR-7).
- Timer fonctionne même si la fenêtre est en arrière-plan (notification OS) (NFR-9, EXPERIENCE Interaction Primitives).
- Les durées utilisées sont celles persistrées (story 4.1) — pas de durées en dur dans le React.
- Contraste texte AA sur le chip timer (NFR-9).

**Ask First:**
- Aucun.

**Never:**
- Envoyer des notifications sans passer par `notify_pomodoro_phase`.
- Garder le timer actif après fermeture de la fenêtre (pas de background daemon).
- Démarrer automatiquement un cycle au montage — l'utilisateur doit cliquer Démarrer.

## I/O & Edge-Case Matrix

|| Scenario | Input / State | Expected Output / Behavior | Error Handling |
||----------|--------------|---------------------------|----------------|
|| Démarrage | Clic « Démarrer » | Timer travail comptage, chip affiche état + rebours | N/A |
|| Fin de phase travail | Rebours à 0 | Notification OS « Pause » + état pause automatique | Notification échouée → log, pas de crash |
|| Fin de phase pause | Rebours à 0 | Notification OS « Travail » + état travail automatique | Idem |
|| Arrêt manuel | Clic « Arrêter » | Timer stoppé, état idle, pas de notification | N/A |
|| Fenêtre arrière-plan | Phase terminée | Notification OS visible malgré fenêtre minifiée | Dépend OS — pas contrôleable par Fun |
|| Plusieurs cycles | Lancement continu | Cycles s'enchaînent automatiquement | N/A |
|| Notification non supportée | OS sans notification plugin | Log warning, pas de crash | À gérer côté Tauri |

</frozen-after-approval>

## Code Map

- `src-tauri/src/notify.rs` — `notify_pomodoro_phase()` (ligne 7) : commande Tauri existante, invoque le plugin notification.
- `src-tauri/src/lib.rs` — `notify_pomodoro_phase` déjà enregistrée dans `invoke_handler` (ligne 46).
- `src/components/workshop/PomodoroChip.tsx` — **update** : timer, état, rebours, boutons, appel `invoke('notify_pomodoro_phase')` à la fin de phase.
- `src/components/workshop/WorkshopLayout.tsx` — **update** : ne pas bloquer — le timer est autonome dans le chip.
- `src/lib/pomodoro.ts` — **new** : helper `invoke('notify_pomodoro_phase', { title, body })`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/components/workshop/PomodoroChip.tsx` — timer avec display MM:SS, état (idle / travail / pause), boutons Démarrer / Reprendre / Arrêter.
- [ ] `PomodoroChip.tsx` — à la fin de chaque phase, appeler `invoke('notify_pomodoro_phase', { title: 'Pomodoro', body: 'Phase terminée — pause' })`.
- [ ] `PomodoroChip.tsx` — cycle automatique : après notification, passer à la phase suivante sans action utilisateur.
- [ ] `src/lib/pomodoro.ts` — helper invoke pour la notification.
- [ ] Vérifier que le plugin notification est bien activé dans `tauri.conf.json` et les permissions.

**Acceptance Criteria:**
- Given des durées configurées, when l'utilisateur démarre le Pomodoro, then le chip affiche l'état travail et le compte à rebours.
- Given une phase travail ou pause terminée, when le timer atteint zéro, then Tauri envoie une notification OS.
- Given plusieurs cycles, when une phase se termine, then la phase suivante démarre automatiquement sans redémarrage manuel.
- Given la fenêtre Fun en arrière-plan, when une phase se termine, then la notification OS s'affiche quand même.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` — expected: exit 0
- `npm run build` — expected: exit 0
- `cargo test --lib` — expected: pas de régression

**Manual checks:**
- `npm run tauri dev` : configurer 25/5, démarrer le timer, laisser la fenêtre en arrière-plan, vérifier que la notification OS apparaît à la fin de la phase.
- Vérifier l'enchaînement automatique des cycles.
- Arrêter manuellement — le timer s'arrête sans notification.

## Suggested Review Order

**Timer React**
- Point d'entrée : timer, affichage, cycle, boutons.
  [`PomodoroChip.tsx`](../../src/components/workshop/PomodoroChip.tsx)

**Notification Rust**
- `notify_pomodoro_phase` existante — laisser le plugin gestion OS.
  [`notify.rs:7`](../../src-tauri/src/notify.rs#L7)

**Helper frontend**
- `pomodoro.ts` — wrapper invoke notification.
  [`pomodoro.ts`](../../src/lib/pomodoro.ts)
