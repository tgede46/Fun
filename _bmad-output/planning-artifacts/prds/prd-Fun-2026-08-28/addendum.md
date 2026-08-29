# Addendum PRD — Fun

Détails techniques et décisions hors corps PRD. Pour architecture / solution design.

## Stack (brief + coaching)

- Shell desktop : **Next.js + Tauri** (PC)
- Backend / cloud : **Google Cloud** si nécessaire (Spring Boot mentionné brief)
- Canvas sketch : `@excalidraw/excalidraw` (embed)
- Canvas UML : draw.io via `embed.diagrams.net` ou `react-drawio` (nice MVP)
- IA : open source — Ollama / modèle local `[ASSUMPTION]` ; choix final = Open Question PRD §8

## Décisions coaching PRD (2026-08-29)

| Sujet | Décision |
|---|---|
| Collab canvas | Après MVP (v2) |
| draw.io | Nice |
| code → UML | **Must** MVP |
| Benchmark modèles | Repoussé post-MVP |
| Pomodoro | Durées custom, cycles répétés, notifs PC |

## Risque scope MVP 3 jours

Must : FR-1–7 + **FR-6 code→UML**. Nice : FR-8 draw.io. Si dépassement : Plan A draw.io = placeholder « Bientôt » ; réduire FR-6 à diagramme classes minimal.

## Sources

- Brief : `_bmad-output/planning-artifacts/briefs/brief-Fun-2026-08-27/`
- Brainstorm : `_bmad-output/brainstorming/brainstorm-fun-2026-08-28/`
