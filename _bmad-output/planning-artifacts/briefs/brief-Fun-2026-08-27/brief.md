---
title: "Product Brief: Fun"
status: ready
created: 2026-08-27
updated: 2026-08-28
---

# Product Brief: Fun

## Executive Summary

**Fun** est une application **desktop PC** (Next.js + Tauri) qui regroupe, dans un seul outil, ce que Gedeonkp fait aujourd’hui en jonglant entre plusieurs apps : dessiner des schémas, discuter avec une IA pour générer ou corriger des diagrammes, rester concentré avec un Pomodoro, et travailler sur un **dossier projet** ouvert localement.

Le problème n’est pas seulement « trop d’outils » : c’est un parcours de travail **fragmenté**. Avancer vite, puis montrer, expliquer ou faire valider (amis ; un jour équipe ou chef) devient lent et manuel. Fun vise d’abord un **MVP solo en ~3 jours** (fenêtre vacances), simple, utilisable sur le poste — sans ambition business ni scale.

## The Problem

Quand on développe un produit, il faut aller vite : concevoir, schématiser, expliquer ce qui a été fait, parfois en rapport ou en démo. Aujourd’hui, ça passe par **plusieurs logiciels séparés** (whiteboard, timer, chat IA, mail…). Le suivi est flou ; les demandes d’ajouts arrivent en urgence ; pour dire « c’est fini », il faut encore **aller voir quelqu’un** (collègue, chef) plutôt que de soumettre et vérifier dans le même flux.

Coût : perte de temps, friction, fatigue d’assembler les produits des autres. Gedeonkp a peu de temps hors travail — seulement des fenêtres courtes (vacances, soirs). Il veut un outil **à lui**, tout-en-un, pour stopper cette dispersion.

## The Solution

Ouvrir **Fun** sur le PC et y rester. Chatter avec une **IA open source** (« je fais ça ? ») : elle explique, génère et **modifie des diagrammes en live**. Dessiner / structurer sur un canvas (Excalidraw en premier ; draw.io en onglet, avec repli « bientôt » si l’intégration bloque). Lancer un **Pomodoro** à côté (durées choisies, notifications travail/pause). Ouvrir un **dossier projet** local pour lier l’IA et les diagrammes au travail en cours (pas tout le PC au MVP).

Plus tard (hors MVP) : revue / mail, collab amis ou équipe, automatisations (Calendar, Trello…), jeux en pause.

## What Makes This Different

Pas un « moat » technique inventé : la différence, c’est la **facilité d’un seul petit logiciel** qui remplace le ballet Excalidraw + ChatGPT + timer + … pour le même flux de travail. Exécution et intégration > feature unique.

## Who This Serves

**Primaire (MVP)** : Gedeonkp, seul, sur son poste — side-project personnel.

**Secondaire (après MVP)** : amis sur des projets partagés ; éventuellement équipe / chef au travail pour montrer et faire valider.

## Success Criteria

À la fin des ~3 jours MVP, succès si :

1. J’ouvre Fun + un dossier projet et je dessine (Excalidraw).
2. Je chat avec l’IA et elle génère / modifie un diagramme.
3. Le Pomodoro notifie fin de travail / pause.

Pas de critère business ni d’usage large à ce stade — prouver que le tout-en-un marche **simplement pour soi**.

## Scope

**Dans le MVP**

- App PC (Next + Tauri), Google Cloud si besoin (Spring Boot)
- Canvas Excalidraw + dossier projet
- Chat IA open source → génère / modifie diagramme
- Pomodoro + notifications PC
- draw.io (ou onglet « bientôt » — Plan A si bloqué)
- Code → UML / benchmark modèles **si le temps le permet**

**Hors MVP (confirmé)**

- Mobile
- Jeux en pause
- Intégrations avancées Trello / Calendar / mail
- Déploiement / orchestration (K8s, etc.)
- Collab chef / équipe
- Accès à tout le PC (seulement le dossier projet ouvert)

## Vision

Les soirs après le boulot (environ **2–3 heures** avant de dormir), ouvrir Fun, avancer sur le projet, et **montrer / travailler** avec des amis ou des équipes — sans reconstruire le flux à chaque fois dans cinq apps différentes. Si ça tient, élargir progressivement (collab, automatisations, draw.io solide, business plus tard).
