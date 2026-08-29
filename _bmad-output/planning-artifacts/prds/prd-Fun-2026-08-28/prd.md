---
title: "PRD: Fun"
status: final
created: 2026-08-28
updated: 2026-08-29
---

# PRD: Fun

## 0. Document Purpose

PRD hobby/solo pour **Fun** — application desktop PC qui unifie canvas, IA et focus. Destiné au builder (Gedeonkp) et aux workflows downstream (architecture, epics). Vocabulaire ancré au §3 Glossary. Inputs : brief `brief-Fun-2026-08-27`, brainstorm `brainstorm-fun-2026-08-28`.

## 1. Vision

**Fun** est une plateforme desktop qui remplace la fatigue de jongler entre **plusieurs modèles IA** et **plusieurs applications** (whiteboard, chat, timer…). L’utilisateur ouvre un **Projet**, reste dans une seule app, schématise, dialogue avec une IA open source, et valide ses choix sans reconstruire le flux à chaque session.

Le MVP (~3 jours, vacances) prouve que le tout-en-un fonctionne **pour soi** sur son poste. La vision long terme : soirs après le boulot, montrer et avancer avec des amis — sans repartir sur cinq outils.

## 2. Target User

### 2.1 Jobs To Be Done

- **Schématiser** — créer et comprendre les diagrammes d’un projet (quoi faire, comment c’est structuré).
- **Dialoguer** — discuter avec une IA qui réagit et répond dans le même flux.
- **Décider** — valider ou corriger (« OK », repartir de zéro) sans changer d’app.
- *(Support)* **Rester concentré** — Pomodoro configurable à côté du travail (pas un job principal).

### 2.2 Non-Users (v1)

- Utilisateurs mobile.
- Équipes / chef en validation formelle (v2+).
- Usage business à grande échelle.

### 2.3 Key User Journeys

- **UJ-1.** Gedeonkp ouvre Fun le soir, charge un **Projet** (dossier local), crée un **Diagramme**, dessine sur le **Canvas**, lance le **Pomodoro**, et avance sans quitter l’app.
- **UJ-2.** Gedeonkp demande à l’**Assistant IA** de revoir ou modifier le diagramme ; il voit les changements en direct, accepte ou demande de repartir de zéro.
- **UJ-3.** Gedeonkp ouvre le code du **Projet** ; l’Assistant génère un diagramme **UML** (ou équivalent) à partir du dossier.

## 3. Glossary

- **Projet** — Dossier local ouvert dans Fun ; périmètre des fichiers code et diagrammes.
- **Diagramme** — Fichier de dessin persisté dans le Projet (format Excalidraw / `.excalidraw` ou équivalent).
- **Canvas** — Surface de dessin style Excalidraw (sketch libre).
- **Assistant IA** — Modèle open source (local ou connecté) accessible via **Chat**.
- **Chat** — Panneau de conversation avec l’Assistant IA.
- **Pomodoro** — Timer configurable (travail / pause) avec notifications système.
- **Onglet UML** — Vue draw.io pour diagrammes structurés (nice-to-have MVP).

## 4. Features

### 4.1 Projet et Canvas

**Description :** L’utilisateur ouvre un Projet, crée des Diagrammes, dessine sur le Canvas Excalidraw. Réalise UJ-1.

**Functional Requirements :**

#### FR-1: Ouvrir un Projet

L’utilisateur peut ouvrir un dossier local comme Projet. Réalise UJ-1.

**Consequences (testable) :**
- Fun affiche le nom du Projet et liste les Diagrammes existants.
- Les Diagrammes sont persistés sous le Projet.

#### FR-2: Créer et éditer un Diagramme

L’utilisateur peut créer un Diagramme vide et dessiner (formes, crayon, texte — capacités Excalidraw embed). Réalise UJ-1.

**Consequences (testable) :**
- Un nouveau Diagramme apparaît dans le Projet.
- Les modifications sont sauvegardées et rechargées à la réouverture.

**Out of Scope (MVP) :** inviter une autre personne sur le Canvas (v2).

### 4.2 Assistant IA et Chat

**Description :** Chat avec Assistant IA open source ; modifications visibles sur le Canvas ; relecture des imperfections. Réalise UJ-2.

**Functional Requirements :**

#### FR-3: Converser avec l’Assistant

L’utilisateur peut envoyer des messages dans le Chat et recevoir des réponses. Réalise UJ-2.

**Consequences (testable) :**
- Le Chat reste disponible pendant l’édition d’un Diagramme.
- L’historique de la session est visible dans le panneau Chat.

#### FR-4: Modifier le Diagramme via l’Assistant

L’utilisateur peut demander à l’Assistant de modifier le Diagramme ; les changements sont visibles en direct sur le Canvas. Réalise UJ-2.

**Consequences (testable) :**
- Après une instruction explicite, au moins une forme ou annotation change sur le Canvas.
- L’utilisateur peut continuer à éditer manuellement après une modification IA.

#### FR-5: Relecture et correction

L’utilisateur peut demander une relecture ; l’Assistant signale des imperfections et propose de corriger ou de repartir de zéro. Réalise UJ-2.

**Consequences (testable) :**
- L’Assistant produit au moins un retour textuel sur le Diagramme courant.
- L’utilisateur peut demander « repartir de zéro » et obtenir un Diagramme vide ou réinitialisé `[ASSUMPTION: réinitialisation = nouveau fichier ou clear canvas — à préciser en architecture]`.

### 4.3 Code vers diagramme (Must MVP)

**Description :** Depuis un Projet ouvert, générer un diagramme (UML ou type adapté) à partir du code source du dossier. Réalise UJ-3.

**Functional Requirements :**

#### FR-6: Générer un diagramme depuis le code

L’utilisateur peut déclencher la génération d’un diagramme à partir des fichiers du Projet. Réalise UJ-3.

**Consequences (testable) :**
- Au moins un type de diagramme (ex. classes UML) est produit sur le Canvas ou en nouveau Diagramme.
- La génération utilise uniquement le dossier Projet ouvert (pas tout le PC).

**Notes :** `[NOTE FOR PM]` Priorité Must pour le MVP 3 jours — risque de dépassement ; réduire le type UML au minimum viable si nécessaire.

### 4.4 Pomodoro

**Description :** Timer à côté du travail ; durées choisies par l’utilisateur ; cycles répétés ; notifications PC.

**Functional Requirements :**

#### FR-7: Configurer et lancer un Pomodoro

L’utilisateur peut définir la durée travail et la durée pause, démarrer le timer, et recevoir une notification à chaque fin de phase. Réalise UJ-1.

**Consequences (testable) :**
- Les durées travail et pause sont persistées entre sessions `[ASSUMPTION: persistance locale]`.
- Une notification système s’affiche à la fin d’une phase travail et d’une phase pause.
- Le timer peut enchaîner plusieurs cycles sans redémarrage manuel `[ASSUMPTION: auto-repeat par défaut]`.

**Out of Scope (MVP) :** jeux en pause, suggestions intelligentes de tâches.

### 4.5 Onglet UML (draw.io) — Nice MVP

**Description :** Second mode de diagramme via draw.io en onglet. Si l’intégration bloque, onglet « Bientôt » (Plan A du brief).

**Functional Requirements :**

#### FR-8: Basculer vers l’Onglet UML *(nice — si le temps)*

L’utilisateur peut ouvrir un Onglet UML distinct du Canvas sketch et y éditer un diagramme structuré.

**Consequences (testable) :**
- Deux onglets visibles : sketch (Excalidraw) et UML (draw.io ou placeholder).
- Si draw.io non intégré : l’onglet UML affiche un message « Bientôt » sans bloquer le reste.

## 5. Non-Goals (Explicit)

- Mobile, jeux en pause, intégrations Trello/Calendar/mail avancées.
- Collab multi-utilisateur temps réel (v2).
- Accès à tout le filesystem PC (seulement Projet).
- Déploiement orchestré (K8s) au MVP.
- Benchmark comparatif des modèles IA au MVP `[NOTE FOR PM]` repoussé vs brainstorm Must I.

## 6. MVP Scope

### 6.1 In Scope

- App desktop PC (Next + Tauri) `[ASSUMPTION: stack confirmée brief]`
- Projet = dossier local
- Canvas Excalidraw : créer, dessiner, sauvegarder
- Chat IA open source : modifier diagramme, relecture
- **Code → diagramme (Must)**
- Pomodoro : durées custom, cycles, notifs
- draw.io : **nice** ; Plan A si bloqué

### 6.2 Out of Scope for MVP

- Collab / inviter des personnes (v2)
- Mobile, jeux, intégrations avancées, K8s
- Benchmark modèles IA (post-MVP)

## 7. Success Metrics

**Primary**

- **SM-1** : À la fin des ~3 jours, Gedeonkp ouvre un Projet, dessine, chat IA modifie un diagramme, Pomodoro notifie — sans outil externe obligatoire. Valide FR-1, FR-2, FR-3, FR-4, FR-7.
- **SM-2** : Au moins une génération code → diagramme réussie sur un Projet réel. Valide FR-6.

**Counter-metrics**

- **SM-C1** : Ne pas optimiser le nombre de features — un canvas + IA + Pomodoro stables valent mieux qu’un draw.io à moitié intégré.

## 8. Open Questions

1. Quel modèle IA open source par défaut (Ollama local vs API) ?
2. FR-5 « repartir de zéro » : clear canvas ou nouveau fichier ?
3. FR-6 : quel sous-ensemble UML minimum (classes seulement ?) pour tenir 3 jours ?

## 9. Assumptions Index

- §4.2 FR-5 — réinitialisation diagramme : mécanisme exact TBD.
- §4.4 FR-7 — persistance des durées Pomodoro en local.
- §4.4 FR-7 — cycles Pomodoro enchaînés automatiquement.
- §6.1 — stack Next + Tauri + GCP backend si nécessaire.
