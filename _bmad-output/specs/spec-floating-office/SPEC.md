---
id: SPEC-floating-office
companions:
  - brownfield.md
  - architecture-diagrams.md
  - companion-states.md
  - moscow-priorities.md
sources:
  - _bmad-output/brainstorming/brainstorm-chat-voice-floating-connectors-2026-08-31/brainstorm-intent.md
---

> **Contrat canonique.** Ce SPEC et les fichiers `companions:` constituent le contrat complet pour construire, tester et valider l'épic Floating Office.

# Floating Office — Compagnons flottants atelier Fun

## Why

**Opportunité + vision.** L'atelier Fun expose aujourd'hui le chat IA et le Pomodoro comme éléments fixes du layout — l'utilisateur ne peut ni les déplacer, ni fermer le chat pendant qu'Trace réfléchit, ni bénéficier d'une ambiance focus type lofi.co. Gedeonkp veut un **bureau flottant minimaliste** : compagnons 💬 et 🍅 déplaçables, travail IA async avec retour différé par notification OS, et Souffle intégrant musique + scène visuelle — sans copier Discord ou lofi.co entièrement.

## Capabilities

- **CAP-1**
  - **intent:** L'utilisateur invoque et ferme le compagnon chat 💬 sans interrompre une requête IA en cours.
  - **success:** Après envoi d'un message et fermeture de l'overlay, la pastille 💬 affiche l'état « en cours » puis « terminé » ; à la réouverture, la réponse assistant est présente dans le thread.

- **CAP-2**
  - **intent:** L'utilisateur est notifié sur le bureau quand une tâche IA async se termine, avec indication si le canvas a changé.
  - **success:** Une notification OS native s'affiche à la fin du traitement ; le corps mentionne la réponse ou une action canvas (ex. « Diagramme mis à jour ») ; un badge sur 💬 signale l'état « non lu ».

- **CAP-3**
  - **intent:** L'utilisateur repositionne les compagnons 💬 et 🍅 librement dans l'atelier ; les positions sont restaurées au rechargement du projet.
  - **success:** Drag-and-drop des pastilles ; après reload de l'app ou réouverture du projet, les positions correspondent aux dernières valeurs enregistrées.

- **CAP-4**
  - **intent:** L'utilisateur lance et configure Souffle (Pomodoro) depuis un widget 🍅 flottant système, indépendant du layout central.
  - **success:** 🍅 draggable avec timer, config durées, start/stop — parité fonctionnelle avec `PomodoroChip` actuel, sans régression des notifications de fin de phase.

- **CAP-5**
  - **intent:** L'utilisateur bénéficie d'une ambiance lofi (audio + scène visuelle légère) pendant la phase travail de Souffle.
  - **success:** Au démarrage Souffle phase travail, l'audio lofi démarre et une scène visuelle s'affiche ; mute/volume accessible depuis 🍅 ; en pause, l'ambiance s'adoucit ou s'arrête selon `companion-states.md`.

- **CAP-6**
  - **intent:** Les compagnons partagent une coque UI commune (drag, persistance, z-index) sans dupliquer la logique métier chat/timer.
  - **success:** Un composant `FloatingCompanion` (ou équivalent) héberge 💬 et 🍅 ; settings compagnons persistés dans `.fun/settings.json` via commandes Tauri existantes étendues.

## Constraints

- Toutes les notifications passent par le plugin Tauri notification déjà utilisé pour Pomodoro — pas de service externe.
- Aucun appel OpenRouter depuis le WebView ; chat reste sur `send_chat_message` (AD-1).
- Microcopy en français, ton calme (NFR-8).
- Le canvas Excalidraw, la sauvegarde diagramme et les personas Trace/Claire ne régressent pas (critères brainstorming).
- Audio MVP : fichiers embarqués ou URL configurable — pas de dépendance obligatoire à lofi.co en ligne.
- La sidebar chat fixe actuelle peut coexister en V1 (mode épinglé) mais le mode par défaut devient 💬 flottant.

## Non-goals

- Clone complet de lofi.co (multi-scènes animées, compte, social).
- Salon vocal WebRTC type Discord.
- Push-to-talk, TTS, intégration bot Discord lofi.co (Could — hors MVP).
- Remplacement du backend Rust chat/benchmark/pomodoro.

## Success signal

Gedeonkp ouvre l'atelier, envoie « Crée un diagramme de démo » via 💬, ferme l'overlay pendant que Trace réfléchit, reçoit une notification OS, rouvre 💬 et voit la réponse plus les changements canvas ; en parallèle il déplace 🍅, lance Souffle avec lofi + scène, et retrouve positions et préférences au prochain lancement.

## Assumptions

- `ProjectSettings` / `.fun/settings.json` peut être étendu pour positions compagnons et préférences son sans migration destructive.
- `ChatSidebar` existant est réutilisable comme contenu de l'overlay 💬.
- `MeditationOverlay` sert de référence pour la scène visuelle Souffle pause/travail.

## Open Questions

- Source audio MVP : pack embarqué royalty-free dans `public/sounds/` ou URL stream configurable par projet ?
- Mode sidebar épinglé (double-clic 💬) : livrer en MVP ou reporter en V1 Should ?
