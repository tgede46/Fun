---
title: 'Story 4.3 — Pause méditation overlay'
type: feature
created: '2026-08-29'
status: done
baseline_commit: NO_VCS
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Fun-2026-08-29/EXPERIENCE.md
  - _bmad-output/implementation-artifacts/spec-4-2-timer-plus-cycles-plus-notifications.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** À la fin d'une phase travail Pomodoro, l'utilisateur passe brutalement en pause sans moment de respiration — le timer passe de « travail » à « pause » sans transition.

**Approach:** Quand le timer atteint zéro en phase travail, un overlay scrim recouvre le canvas et une modale centrée affiche un texte guidé court (respiration) avec un bouton « Reprendre ». L'overlay se ferme sur Esc ou clic « Reprendre », et la phase pause (ou nouveau cycle) continue. Le focus est piégé dans la modale (focus trap).

## Boundaries & Constraints

**Always:**
- L'overlay n'apparaît qu'à la fin de la phase **travail** — pas à la fin de la pause (FR-7, UX-DR9).
- Focus trap : Tab/Shift+Tab circulent dans la modale uniquement, Esc ferme (NFR-9, UX-DR14).
- Le texte guidé est court (1 à 3 phrases) et en français (NFR-8).
- L'overlay ne bloque pas la notification OS qui a déjà été envoyée (story 4.2) — c'est une couche supplémentaire.
- Bouton « Reprendre » et Esc ferment l'overlay et laissent la phase pause démarrer.

**Ask First:**
- Aucun.

**Never:**
- Afficher l'overlay à chaque cycle si l'utilisateur l'a désactivé (à décider : désactivation possible ? oui, dans settings).
- Bloquer l'application complètement — le timer continue en arrière-plan si l'utilisateur ignore l'overlay ? Non — l'overlay must be dismissed before the pause phase starts.

## I/O & Edge-Case Matrix

|| Scenario | Input / State | Expected Output / Behavior | Error Handling |
||----------|--------------|---------------------------|----------------|
|| Fin de phase travail | Timer rebours à 0 | Overlay scrim + modale centree avec texte guidé + bouton Reprendre | N/A |
|| Esc ou clic Reprendre | Focus dans modale | Overlay se ferme, phase pause démarre | N/A |
|| Navigation clavier dans modale | Tab / Shift+Tab | Focus piégé dans les éléments de la modale | N/A |
|| Utilisateur ne fait rien | Modale ouverte | L'overlay reste ouvert — le timer ne continue pas | Comportement volontaire : attendre dismissal |
|| Désactivation dans settings | Utilisateur choue pas de méditation | Pas d'overlay, la notification OS suffit | À ajouter dans settings futur |

</frozen-after-approval>

## Code Map

- `src/components/workshop/PomodoroChip.tsx` — **update** : gérer l'état `showMeditationOverlay`, déclencher au fin de phase travail.
- `src/components/workshop/MeditationModal.tsx` — **new** : modale centrée avec texte guidé, bouton Reprendre, focus trap, gestion Esc.
- `src/components/workshop/WorkshopLayout.tsx` — **update** : afficher l'overlay dans la layer scrim au-dessus du canvas.
- `src/lib/pomodoro.ts` — pas de changement Rust — l'overlay est purement UI.

## Tasks & Acceptance

**Execution:**
- [ ] `src/components/workshop/MeditationModal.tsx` — modale avec texte de respiration court, bouton Reprendre, focus trap (Tab circule dans modal uniquement).
- [ ] `src/components/workshop/MeditationModal.tsx` — gestion Esc : fermer la modale et déclencher le passage en phase pause.
- [ ] `src/components/workshop/PomodoroChip.tsx` — au fin de phase travail, set `showMeditationOverlay = true` avant de lancer la phase pause.
- [ ] `WorkshopLayout.tsx` — afficher l'overlay scrim avec la modale centrée, au-dessus du canvas.
- [ ] Vérifier l'accessibilité : contraste texte AA, taille suffisante, focus visible.

**Acceptance Criteria:**
- Given une phase travail Pomodoro terminée, when le timer atteint zéro, then un overlay scrim recouvre le canvas et une modale centrée affiche un texte guidé court + bouton « Reprendre ».
- Given la modale méditation ouverte, when l'utilisateur appuie sur Esc ou clique « Reprendre », then l'overlay se ferme et la phase pause (ou nouveau cycle) continue.
- Given la modale ouverte, when l'utilisateur navigue au clavier, then le focus est piégé dans la modale.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` — expected: exit 0
- `npm run build` — expected: exit 0
- `npx vitest run` — expected: tests React si couverture ajoutée

**Manual checks:**
- `npm run tauri dev` : lancer un Pomodoro 25 min, laisser le timer atteindre zéro, vérifier que l'overlay scrim apparaît avec le texte guidé.
- Appuyer sur Esc — l'overlay se ferme et la phase pause démarre.
- Naviguer avec Tab — le focus reste dans la modale.
- Désactiver l'overlay (si paramètre) — aucune modale, seulement la notification.

## Suggested Review Order

**Modale méditation**
- Point d'entrée : texte guidé, bouton, focus trap, Esc.
  [`MeditationModal.tsx`](../../src/components/workshop/MeditationModal.tsx)

**Déclenchement depuis le timer**
- `PomodoroChip.tsx` : `showMeditationOverlay` à la fin de phase travail.
  [`PomodoroChip.tsx`](../../src/components/workshop/PomodoroChip.tsx)

**Overlay scrim**
- `WorkshopLayout.tsx` : layer scrim au-dessus du canvas.
  [`WorkshopLayout.tsx`](../../src/components/workshop/WorkshopLayout.tsx)
