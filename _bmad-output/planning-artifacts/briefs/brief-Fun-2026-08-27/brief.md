---
title: "Product Brief: Fun"
status: ready
created: 2026-08-27
updated: 2026-08-31
---

# Product Brief: Fun

## Executive Summary

**Fun** est un atelier de travail desktop pour un créateur solo qui veut garder un projet cohérent dans un seul environnement : ouvrir un dossier local, dessiner sur un canvas, converser avec une IA pour modifier ou générer des diagrammes, puis rester concentré avec un Pomodoro. L’objectif n’est pas de lancer une plateforme géante, mais de fournir un espace calme et utile pour avancer sur une idée sans perdre la piste entre plusieurs outils.

Le problème du terrain est simple : le travail de conception passe par des fragments dispersés (canvas, chat, timer, notes, fichier projet, validation manuelle). Le cerveau se disperse et le contexte réel du projet se fragmente. Fun vise à regrouper ces étapes dans un périmètre restreint, connu, et sécurisé : un dossier projet local, son histoire visuelle, son assistant IA, et sa cadence de travail.

## The Problem

Quand un projet avance, il faut souvent passer de l’idée à la structure, du schéma à l’explication, puis de la validation au travail de concentration. Aujourd’hui, cela implique de basculer entre plusieurs logiciels et de recopier le contexte à chaque étape. Le risque n’est pas seulement le temps perdu ; c’est la dilution du sens du projet : le travail est fragmenté, les décisions se perdent, et le fait de montrer ou de faire valider une idée demande un effort manuel supplémentaire.

Pour un utilisateur solo, cela devient particulièrement pénible. Les fenêtres de travail sont courtes, les projets sont personnels, et il n’y a pas de place pour des outils lourds ou des flux trop complexes. Le besoin est clair : un environnement compact, fiable, orienté projet, et suffisamment neutre pour s’y installer sans friction.

## The Solution

Fun fournit un environnement desktop centré sur un dossier projet ouvert localement. Le produit initialise une structure dédiée sous `.fun/`, affiche les projets récents et permet d’ouvrir un dossier comme contexte de travail. Une fois le projet chargé, l’utilisateur peut créer et sauvegarder des diagrammes Excalidraw, les relire, les modifier ou les générer via une conversation avec l’IA.

Le cœur du produit est l’atelier : un canvas principal, une zone de chat, un état de projet visible, et un timer de concentration. La conversation IA est reliée au projet, et un benchmark des modèles `:free` OpenRouter a pour rôle de sélectionner le modèle actif de manière transparente. La dimension Pomodoro vient compléter la boucle de travail sans sortir du contexte.

## What Makes This Different

La différence de Fun n’est pas une innovation de fond de marché artificielle ; elle repose sur une promesse simple et forte : un seul espace de travail par projet. L’utilisateur ne jongle plus entre un tableau blanc, un assistant IA, un timer et des fichiers dispersés. L’outil agit comme un atelier domestique de conception — compact, cadré, efficace, et intégré.

Le produit est aussi intentionally scoped : il ne s’étend pas à tout le filesystem, ni à un usage multi-utilisateurs, ni à une infrastructure backend complète. L’avantage vient de la discipline de périmètre et de la qualité d’intégration, pas d’un faux « moat » technique.

## Who This Serves

**Principal** : un créateur solo, développeur, designer ou concepteur de projets personnels, qui travaille sur son poste et veut une vraie continuité entre idée, schéma, IA et concentration.

**Secondaire** : des amis ou une petite équipe qui peuvent revoir un projet, un diagramme ou un concept dans le même contexte, sans devoir reconstruire le flux de travail depuis zéro.

## Success Criteria

Le produit est un succès si, dans le flux principal :

1. l’utilisateur ouvre un dossier local et Fun crée le contexte du projet ;
2. il crée un diagramme et l’éditer en direct sur le canvas ;
3. il converse avec l’IA pour modifier ou générer un schéma utile ;
4. le Pomodoro reste fonctionnel et visible sans sortir du projet ;
5. le benchmark IA sélectionne un modèle actif fiable et le chat l’utilise sans friction.

Ce n’est pas un objectif de scale business ; c’est une preuve que le flux « projet + dessin + IA + concentration » fonctionne réellement pour une personne dans un contexte temporel limité.

## Scope

**Dans le MVP**

- application desktop PC via Tauri + Next.js static export ;
- ouverture d’un dossier projet local ;
- structure `.fun/` avec métadonnées de projet ;
- canvas Excalidraw, liste et création de diagrammes ;
- assistant IA via OpenRouter ;
- benchmark des modèles `:free` ;
- Pomodoro configurable avec notifications et pause méditation ;
- onglet UML avec placeholder « Bientôt » si l’intégration ne va pas au bout.

**Hors MVP (confirmé)**

- mobile ;
- collaboration multi-utilisateur ;
- accès au filesystem complet du PC ;
- backend Fun hébergé ;
- intégrations externes lourdes (Trello, calendrier, mail) ;
- jeu ou produits non liés au flux de projet.

## Vision

L’objectif à moyen terme est de transformer Fun en un studio de travail de projet personnel, où l’utilisateur peut ouvrir un dossier, faire apparaître l’idée, la dessiner, la faire parler, et la faire avancer sans sortir du contexte. Si le flux tient, le produit peut ensuite s’étendre vers des fonctions de revue, de validation, de partage plus structuré, et d’aide plus poussée à la conception — toujours sans perdre l’esprit central de simplicité et de concentration.
