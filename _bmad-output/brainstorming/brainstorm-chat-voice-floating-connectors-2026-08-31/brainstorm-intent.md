# Intent — Floating Office (Fun Atelier)

**Source :** session brainstorming 2026-08-31 · mode Creative Partner  
**Projet :** Fun · **Auteur :** Gedeonkp

## Problème

L'atelier Fun aujourd'hui : chat fixe à droite, pomodoro fixe en bas, pas de compagnon minimaliste, pas d'ambiance focus, pas de travail IA async avec retour différé.

## Vision

Un **bureau flottant minimaliste** dans l'atelier : deux compagnons système (**💬** chat IA, **🍅** Souffle focus), déplaçables, connectés entre eux et au canvas — inspiré de la simplicité Discord/lofi.co sans copier leurs produits entiers.

## Décisions verrouillées

| # | Décision |
|---|----------|
| 1 | Compagnon chat = pastille **💬** repliée (~40 px), draggable, position persistée |
| 2 | Clic 💬 → overlay chat (sort du layout), pas sidebar obligatoire |
| 3 | **Fermer l'overlay ≠ annuler** — Trace continue en arrière-plan |
| 4 | États 💬 : `idle` · `thinking` (pulse) · `done` (badge + notif OS) |
| 5 | Notif OS à la fin : réponse + mention si canvas modifié |
| 6 | **Souffle** (Pomodoro) = widget **système** flottant 🍅, draggable, offert par défaut |
| 7 | Souffle MVP = **musique lofi + scène visuelle légère** (inspiré [lofi.co](https://lofi.co/)) |
| 8 | Architecture cible : composant **`FloatingCompanion`** (💬 + 🍅, drag, persistance `.fun/settings.json`) |

## MoSCoW

### Must (MVP)

- 💬 flottant async + notifications Tauri
- 🍅 Souffle flottant + timer existant repensé
- Lofi : audio au démarrage Souffle, mute/volume sur 🍅
- Scène visuelle : 1 ambiance (overlay léger, réutiliser esprit `MeditationOverlay`)
- Persistance positions + préférences son

### Should (V1)

- Sons chat (envoi / réponse)
- Notif enrichie (« diagramme mis à jour »)
- 2–3 ambiances + playlists
- Double-clic 💬 → mode sidebar épinglé (option)

### Could

- Push-to-talk → texte
- TTS réponse Trace
- Intégration Discord / bot lofi.co
- WebRTC salon vocal

### Won't (now)

- Clone lofi.co complet
- Chat sidebar comme seule UI

## Connecteurs (philosophie)

- Souffle ON → lofi audio + scène · pause → adouci
- Trace done → notif OS · duck audio 2 s (V1)
- Trace → canvas (existant) · notif décrit l'action
- 💬 et 🍅 partagent drag/persist/settings

## Critères d'acceptation MVP

1. 💬 visible en atelier, déplaçable, position restaurée au reload
2. Envoi message → fermeture overlay → pulse 💬 → notif à la fin → réouverture montre réponse
3. 🍅 déplaçable, démarre timer, lance lofi + scène travail
4. Fin phase → notif OS (existant) + transition visuelle/audio pause
5. Aucune régression canvas / chat Trace / save diagramme

## Prochaine étape BMad suggérée

`bmad-spec` ou `bmad-build` sur epic **Floating Office** — decouper en stories : FloatingCompanion shell → 💬 async+notif → 🍅 drag+lofi audio → scène visuelle.
