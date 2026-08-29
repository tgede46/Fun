---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: final
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-Fun-2026-08-28/prd.md
  - _bmad-output/planning-artifacts/prds/prd-Fun-2026-08-28/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Fun-2026-08-29/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Fun-2026-08-29/EXPERIENCE.md
  - _bmad-output/planning-artifacts/briefs/brief-Fun-2026-08-27/brief.md
---

# Fun - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Fun, decomposing the requirements from the PRD, UX Design, and Architecture spine into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1: L'utilisateur peut ouvrir un dossier local comme Projet ; Fun affiche le nom du Projet et liste les Diagrammes existants ; les Diagrammes sont persistés sous le Projet (UJ-1).

FR-2: L'utilisateur peut créer un Diagramme vide et dessiner sur le Canvas Excalidraw (formes, crayon, texte) ; les modifications sont sauvegardées et rechargées à la réouverture (UJ-1).

FR-3: L'utilisateur peut converser avec l'Assistant IA via le Chat pendant l'édition d'un Diagramme ; l'historique de session est visible (UJ-2).

FR-4: L'utilisateur peut demander à l'Assistant de modifier le Diagramme ; les changements sont visibles en direct sur le Canvas ; édition manuelle possible après modification IA (UJ-2).

FR-5: L'utilisateur peut demander une relecture du Diagramme ; l'Assistant signale des imperfections et propose corriger ou repartir de zéro ; reset = canvas vide via écrasement du fichier `.excalidraw` courant (UJ-2, AD-6).

FR-6: L'utilisateur peut générer un diagramme (ex. classes UML) à partir des fichiers source du Projet ouvert ; multi-langue via pipeline IA-first ; sortie dans `.fun/diagrams/` (UJ-3).

FR-7: L'utilisateur peut configurer durées travail/pause, lancer un Pomodoro, recevoir notifications OS à chaque fin de phase, enchaîner plusieurs cycles ; durées persistées dans `.fun/settings.json` (UJ-1, UJ-4).

FR-8: *(Nice MVP)* L'utilisateur peut basculer vers un Onglet UML (draw.io) distinct du Sketch ; si non intégré, afficher placeholder « Bientôt » sans bloquer l'app.

FR-9: Le système exécute automatiquement un benchmark des modèles OpenRouter `:free` **tous les 3 jours** (si online), au premier lancement inclus ; met à jour le modèle actif dans `.fun/ai.json` ; Chat et pipelines IA utilisent exclusivement ce modèle actif (AD-3).

### NonFunctional Requirements

NFR-1: Application desktop PC uniquement (Tauri + Next.js static export) — pas mobile v1.

NFR-2: Projet limité au dossier ouvert ; Fun n'accède pas à tout le filesystem PC (AD-4).

NFR-3: WebView isolée — pas d'accès direct fs/API OpenRouter depuis Next.js ; tout via commands Tauri (AD-1).

NFR-4: IA via OpenRouter uniquement, modèles `:free` ; clé API stockée côté Tauri, jamais dans le repo ou WebView (AD-2).

NFR-5: Benchmark OpenRouter `:free` **obligatoire tous les 3 jours** (online) ; premier run au lancement ; rester dans quota free (~≤5 scénarios × N modèles par run) (AD-3).

NFR-6: Canvas + Pomodoro fonctionnent offline ; Chat, modifications IA, code→UML et benchmark requièrent réseau (AD-8).

NFR-7: Pas de backend Fun hébergé au MVP (GCP/Spring Boot deferred) (AD-8).

NFR-8: Microcopy UI en français, ton calme et direct (EXPERIENCE Voice and Tone).

NFR-9: Contraste texte AA minimum sur thèmes clair/sombre ; modale méditation avec focus trap et Esc (EXPERIENCE Accessibility Floor).

NFR-10: Fenêtre desktop redimensionnable, minimum ~1024×640 ; canvas ≥60% largeur hors chat (DESIGN Layout).

NFR-11: Succès MVP SM-1/SM-2 : parcours complet sans outil externe obligatoire ; au moins une génération code→diagramme réussie.

### Additional Requirements

- **Epic 1 Story 1 starter:** Initialiser Next.js (`output: 'export'`) + Tauri 2.x ; `frontendDist` = `out/` ; pas de SSR/API routes Next (AD-9).
- Structure repo seed : `src/` (Next UI), `src-tauri/` (Rust commands, project, ai, notify).
- Projet Fun artifacts under `project_root/.fun/` only : `project.json`, `settings.json`, `ai.json`, `diagrams/*.excalidraw` (AD-4, AD-5).
- Tauri commands naming : `snake_case` (`open_project`, `save_diagram`, `run_benchmark`, etc.).
- OpenRouter client Rust (reqwest) ; endpoint `https://openrouter.ai/api/v1` (AD-2).
- `BenchmarkRunner` : suite fixe courte ; écrit `active_model` + `last_benchmark_at` dans `.fun/ai.json` (AD-3).
- `CodeExtractor` trait ; MVP = `AiExtractor` multi-extension ; TreeSitter deferred (AD-7).
- Excalidraw embed `@excalidraw/excalidraw` ; save/load via Tauri commands only (AD-5).
- Pomodoro notifications via Tauri OS notify plugin (FR-7).
- draw.io / FR-8 : Plan A placeholder « Bientôt » si intégration bloquée.
- Modèle OpenRouter par défaut au MVP jusqu'au premier benchmark complet.

### UX Design Requirements

UX-DR1: Tokens couleur clair/sombre (DESIGN.md frontmatter).
UX-DR2: Typographie Excalifont partout.
UX-DR3: Layout atelier toolbar / rail / chat / Pomodoro chip.
UX-DR4: Écran Accueil projets récents.
UX-DR5: Composant Toolbar.
UX-DR6: Composant Mode rail Sketch/UML.
UX-DR7: Composant Chat panel.
UX-DR8: Composant Pomodoro chip.
UX-DR9: Composant Meditation stack.
UX-DR10: Toggle thème clair/sombre.
UX-DR11: Onglet UML « Bientôt » si draw.io absent.
UX-DR12: États vides (accueil, atelier, code→UML).
UX-DR13: Responsive desktop chat drawer si <280px.
UX-DR14: Accessibilité modale méditation + chip timer visible.

### FR Coverage Map

FR-1: Epic 1 — Ouvrir un Projet local
FR-2: Epic 2 — Canvas Sketch Excalidraw
FR-3: Epic 3 — Chat Assistant IA
FR-4: Epic 3 — Modifier diagramme via IA
FR-5: Epic 3 — Relecture et reset diagramme
FR-6: Epic 3 — Code vers diagramme (IA-first multi-langue)
FR-7: Epic 4 — Pomodoro et pause méditation
FR-8: Epic 5 — Onglet UML (nice)
FR-9: Epic 3 — Benchmark OpenRouter `:free` tous les 3 jours

## Epic List

### Epic 1: Lancer Fun et ouvrir un Projet

Gedeonkp peut lancer l'application desktop, voir l'accueil, ouvrir un dossier local et accéder à l'atelier avec la structure `.fun/` initialisée.

**FRs covered:** FR-1

### Epic 2: Schématiser sur le Canvas

Gedeonkp peut créer, dessiner et sauvegarder des diagrammes Excalidraw dans son Projet, dans un atelier conforme au design Fun.

**FRs covered:** FR-2

### Epic 3: Assistant IA OpenRouter (benchmark 3 jours)

Gedeonkp peut dialoguer avec l'IA, faire modifier et relire ses diagrammes, générer un diagramme depuis le code ; le système benchmark les modèles `:free` **tous les 3 jours** et choisit le plus performant.

**FRs covered:** FR-3, FR-4, FR-5, FR-6, FR-9

### Epic 4: Rester concentré (Pomodoro)

Gedeonkp peut lancer un Pomodoro configurable avec notifications OS et pause méditation sans quitter l'atelier.

**FRs covered:** FR-7

### Epic 5: UML structuré (nice)

Gedeonkp peut basculer vers l'onglet UML (draw.io) ou voir « Bientôt » si non intégré.

**FRs covered:** FR-8

---

## Epic 1: Lancer Fun et ouvrir un Projet

Gedeonkp peut lancer l'application desktop, voir l'accueil, ouvrir un dossier local et accéder à l'atelier avec la structure `.fun/` initialisée.

### Story 1.1: Initialiser le shell desktop Tauri + Next.js

As a **développeur Fun**,
I want **un projet Next.js static export embarqué dans Tauri 2**,
So that **Fun tourne comme application desktop PC sans backend Next**.

**Acceptance Criteria:**

**Given** un repo greenfield Fun
**When** je lance `cargo tauri dev`
**Then** une fenêtre desktop s'ouvre avec l'UI Next.js
**And** `next.config` utilise `output: 'export'` et `frontendDist` pointe vers `out/` (AD-9, NFR-1)

**Given** le WebView Next.js
**When** du code tente d'importer `fs` ou d'appeler OpenRouter directement
**Then** ce pattern est absent ; la plateforme passe par Tauri (AD-1, NFR-3)

### Story 1.2: Écran Accueil et projets récents

As **Gedeonkp**,
I want **voir mes projets récents et ouvrir un dossier**,
So that **je reprends vite mon travail du soir**.

**Acceptance Criteria:**

**Given** Fun au lancement sans Projet ouvert
**When** l'accueil s'affiche
**Then** je vois une grille centrée (max ~720px) avec CTA « Ouvrir un dossier » (UX-DR4, NFR-8)

**Given** des projets ouverts précédemment
**When** l'accueil charge
**Then** des cartes projet affichent nom + chemin sous-texte
**And** un clic ouvre l'atelier sur ce dossier

**Given** aucun projet récent
**When** l'accueil s'affiche
**Then** un état vide calme invite à ouvrir un dossier (UX-DR12)

### Story 1.3: Ouvrir un dossier et initialiser `.fun/`

As **Gedeonkp**,
I want **ouvrir un dossier local comme Projet**,
So that **Fun ne touche qu'à ce périmètre**.

**Acceptance Criteria:**

**Given** la boîte de dialogue « Ouvrir un dossier »
**When** je sélectionne un dossier valide
**Then** Tauri enregistre `project_root` et crée `.fun/` s'il n'existe pas (AD-4, FR-1, NFR-2)

**Given** un Projet ouvert
**When** Fun écrit des métadonnées
**Then** seuls `project_root/.fun/project.json`, `settings.json`, `ai.json` et `diagrams/` sont créés/modifiés
**And** le code source hors `.fun/` n'est jamais écrit par Fun

### Story 1.4: Lister les diagrammes du Projet

As **Gedeonkp**,
I want **voir la liste des diagrammes existants**,
So that **je sais ce qui est déjà dans mon Projet**.

**Acceptance Criteria:**

**Given** un Projet avec des fichiers dans `.fun/diagrams/`
**When** l'atelier charge
**Then** Fun affiche le nom du Projet et la liste des `.excalidraw` (FR-1)

**Given** un Projet sans diagramme
**When** l'atelier charge
**Then** un hint « Nouveau diagramme » s'affiche (UX-DR12)

---

## Epic 2: Schématiser sur le Canvas

Gedeonkp peut créer, dessiner et sauvegarder des diagrammes Excalidraw dans son Projet, dans un atelier conforme au design Fun.

### Story 2.1: Layout atelier et design tokens

As **Gedeonkp**,
I want **un atelier avec toolbar, rail, canvas central et zone chat**,
So that **le canvas reste le focus de mon travail**.

**Acceptance Criteria:**

**Given** un Projet ouvert
**When** l'atelier s'affiche
**Then** la toolbar (48px), le rail gauche (48px), le canvas flex et la sidebar chat (320px) sont visibles (UX-DR3, NFR-10)

**Given** les tokens DESIGN.md
**When** l'atelier rend l'UI chrome
**Then** thème clair beige/noir est appliqué par défaut (UX-DR1, UX-DR5)

**Given** Excalifont disponible
**When** l'UI chrome s'affiche
**Then** la typo Excalifont est utilisée (corps 16px) (UX-DR2)

### Story 2.2: Créer un diagramme et embed Excalidraw

As **Gedeonkp**,
I want **créer un diagramme vide et dessiner librement**,
So that **je schématise mon idée comme sur Excalidraw**.

**Acceptance Criteria:**

**Given** un Projet ouvert
**When** je clique « Nouveau diagramme »
**Then** un fichier `.fun/diagrams/<nom>.excalidraw` est créé avec un document Excalidraw vide (FR-2, AD-5)

**Given** un diagramme ouvert
**When** j'utilise crayon, formes ou texte dans l'embed `@excalidraw/excalidraw`
**Then** les éléments apparaissent sur le canvas sketch

### Story 2.3: Sauvegarder et recharger un diagramme

As **Gedeonkp**,
I want **que mes dessins soient persistés automatiquement**,
So that **je retrouve mon travail à la réouverture**.

**Acceptance Criteria:**

**Given** un diagramme modifié dans l'embed
**When** la sauvegarde debounced déclenche `save_diagram`
**Then** Tauri écrit le JSON Excalidraw dans `.fun/diagrams/` (AD-5, FR-2)

**Given** un Projet rouvert
**When** je sélectionne un diagramme existant
**Then** le contenu sauvegardé se recharge dans l'embed via `load_diagram`

### Story 2.4: Toggle thème clair / sombre

As **Gedeonkp**,
I want **basculer entre thème clair et sombre**,
So that **je travaille confortablement le soir**.

**Acceptance Criteria:**

**Given** l'atelier ouvert
**When** je clique le toggle thème dans la toolbar
**Then** l'UI bascule beige/noir ↔ noir/beige (UX-DR10)

**Given** un Projet ouvert
**When** je change de thème
**Then** la préférence est persistée dans `.fun/settings.json` ou store app

**Given** les deux thèmes
**When** le texte principal s'affiche
**Then** le contraste respecte le plancher AA (UX-DR1, NFR-9)

---

## Epic 3: Assistant IA OpenRouter (benchmark 3 jours)

Gedeonkp peut dialoguer avec l'IA, faire modifier et relire ses diagrammes, générer un diagramme depuis le code ; le système benchmark les modèles `:free` **tous les 3 jours** et choisit le plus performant.

### Story 3.1: Configurer la clé OpenRouter et modèle par défaut

As **Gedeonkp**,
I want **enregistrer ma clé OpenRouter de façon sécurisée**,
So that **Fun peut appeler les modèles `:free` sans exposer ma clé**.

**Acceptance Criteria:**

**Given** les paramètres Fun
**When** je saisis une clé `sk-or-…`
**Then** Tauri la stocke hors WebView (secure store) (AD-2, NFR-4)

**Given** aucun benchmark encore exécuté
**When** j'ouvre le Chat ou code→UML
**Then** un modèle `:free` par défaut codé en seed est utilisé jusqu'au premier benchmark

**Given** une requête IA
**When** Tauri appelle OpenRouter
**Then** l'endpoint est `https://openrouter.ai/api/v1` et seuls des modèles `:free` sont éligibles (AD-2)

### Story 3.2: Benchmark automatique OpenRouter tous les 3 jours

As **Gedeonkp**,
I want **que Fun choisisse automatiquement le meilleur modèle `:free`**,
So that **je n'ai pas à comparer les modèles moi-même**.

**Acceptance Criteria:**

**Given** Fun online et clé OpenRouter configurée
**When** je lance Fun pour la première fois (ou `last_benchmark_at` absent)
**Then** `BenchmarkRunner` exécute une suite courte (chat, validité JSON diagramme, smoke code→UML) sur les modèles `:free` éligibles (FR-9, AD-3)

**Given** un benchmark terminé
**When** les scores sont calculés
**Then** `.fun/ai.json` contient `active_model`, `last_benchmark_at` et `last_scores`
**And** le modèle gagnant est le meilleur score composite qualité + latence

**Given** `last_benchmark_at` date de plus de **3 jours** et Fun online
**When** Fun démarre ou un Projet s'ouvre
**Then** un nouveau benchmark s'exécute automatiquement et met à jour `active_model` (FR-9, NFR-5)

**Given** le quota free OpenRouter
**When** le benchmark tourne
**Then** la suite reste ≤5 scénarios × N modèles pour ne pas épuiser les 50 req/jour

**Given** Fun offline
**When** l'intervalle de 3 jours est dépassé
**Then** le benchmark est reporté ; le dernier `active_model` reste utilisé (NFR-6)

### Story 3.3: Converser avec l'Assistant dans le Chat

As **Gedeonkp**,
I want **discuter avec l'Assistant pendant que j'édite un diagramme**,
So that **je reste dans le même flux de travail**.

**Acceptance Criteria:**

**Given** un diagramme ouvert et réseau disponible
**When** j'envoie un message dans le Chat
**Then** Tauri appelle OpenRouter avec le `active_model` et affiche la réponse (FR-3, AD-3)

**Given** une session atelier
**When** j'échange plusieurs messages
**Then** l'historique de session reste visible dans le panneau chat (FR-3, UX-DR7)

**Given** une réponse en streaming
**When** l'Assistant répond
**Then** un indicateur « IA en cours » est visible (UX-DR7)

### Story 3.4: Modifier le diagramme via l'Assistant

As **Gedeonkp**,
I want **demander à l'IA de modifier mon diagramme**,
So that **je vois les changements en direct sur le canvas**.

**Acceptance Criteria:**

**Given** un diagramme avec contenu et le Chat actif
**When** je demande explicitement une modification (ex. « ajoute une boîte API »)
**Then** l'Assistant renvoie un JSON Excalidraw valide appliqué au canvas (FR-4)

**Given** une modification IA appliquée
**When** je continue à dessiner manuellement
**Then** l'embed Excalidraw reste éditable (FR-4)

**Given** une modification IA
**When** elle est appliquée
**Then** `save_diagram` persiste le résultat dans `.fun/diagrams/`

### Story 3.5: Relecture et repartir de zéro

As **Gedeonkp**,
I want **une relecture IA et l'option de repartir de zéro**,
So that **je corrige ou reset mon diagramme sans quitter Fun**.

**Acceptance Criteria:**

**Given** un diagramme ouvert
**When** je demande « qu'est-ce qui cloche ? »
**Then** l'Assistant produit un retour textuel sur le diagramme courant (FR-5)

**Given** un diagramme ouvert
**When** je demande « repartir de zéro »
**Then** `reset_diagram` écrase le fichier avec un Excalidraw vide au même chemin (AD-6, FR-5)

### Story 3.6: Générer un diagramme depuis le code (multi-langue)

As **Gedeonkp**,
I want **générer un diagramme UML depuis le code de mon Projet**,
So that **je visualise la structure sans dessiner à la main**.

**Acceptance Criteria:**

**Given** un Projet avec fichiers source (.ts, .py, .java, .rs, etc.) hors `.fun/`
**When** je déclenche « Depuis le code » dans la toolbar
**Then** Tauri scanne read-only le dossier, envoie les chunks à OpenRouter via `AiExtractor`, valide le JSON Excalidraw et écrit `.fun/diagrams/uml-<iso8601>.excalidraw` (FR-6, AD-7)

**Given** le diagramme généré
**When** la génération réussit
**Then** il s'ouvre sur le canvas ou apparaît dans la liste des diagrammes (FR-6, SM-2)

**Given** un repo sans fichiers source reconnus
**When** je lance la génération
**Then** le message « Aucun fichier source trouvé » s'affiche (UX-DR12)

**Given** une réponse modèle invalide (JSON Excalidraw incorrect)
**When** la génération échoue la validation
**Then** aucun fichier n'est écrit et une erreur claire s'affiche (AD-7)

---

## Epic 4: Rester concentré (Pomodoro)

Gedeonkp peut lancer un Pomodoro configurable avec notifications OS et pause méditation sans quitter l'atelier.

### Story 4.1: Configurer et persister les durées Pomodoro

As **Gedeonkp**,
I want **choisir mes durées travail et pause**,
So that **le timer s'adapte à mon rythme**.

**Acceptance Criteria:**

**Given** le chip Pomodoro en atelier
**When** je clique pour configurer
**Then** je peux saisir durée travail et durée pause (FR-7, UX-DR8)

**Given** des durées modifiées
**When** je les enregistre
**Then** elles sont persistées dans `.fun/settings.json` (FR-7)

### Story 4.2: Timer, cycles et notifications OS

As **Gedeonkp**,
I want **lancer un Pomodoro avec notifications à chaque fin de phase**,
So that **je sais quand passer en pause même si Fun est en arrière-plan**.

**Acceptance Criteria:**

**Given** des durées configurées
**When** je démarre le Pomodoro
**Then** le chip affiche l'état travail ou pause et le compte à rebours (UX-DR8, FR-7)

**Given** une phase travail ou pause terminée
**When** le timer atteint zéro
**Then** Tauri envoie une notification OS (FR-7, NFR-9)

**Given** plusieurs cycles
**When** une phase se termine
**Then** la phase suivante démarre automatiquement sans redémarrage manuel (FR-7)

**Given** la fenêtre Fun en arrière-plan
**When** une phase se termine
**Then** la notification OS s'affiche quand même (EXPERIENCE Interaction Primitives)

### Story 4.3: Pause méditation overlay

As **Gedeonkp**,
I want **une pause guidée courte à la fin du travail**,
So that **je respire avant la phase pause Pomodoro**.

**Acceptance Criteria:**

**Given** une phase travail Pomodoro terminée
**When** le timer atteint zéro
**Then** un overlay scrim recouvre le canvas et une modale centrée affiche un texte guidé court + bouton « Reprendre » (UX-DR9, UJ-4)

**Given** la modale méditation ouverte
**When** j'appuie sur Esc ou « Reprendre »
**Then** l'overlay se ferme et la phase pause (ou nouveau cycle) continue

**Given** la modale ouverte
**When** je navigue au clavier
**Then** le focus est piégé dans la modale (UX-DR14, NFR-9)

**Given** la pause méditation active
**When** le canvas est visible
**Then** le canvas n'est pas éditable jusqu'à fermeture de la modale

---

## Epic 5: UML structuré (nice)

Gedeonkp peut basculer vers l'onglet UML (draw.io) ou voir « Bientôt » si non intégré.

### Story 5.1: Onglet UML — draw.io ou placeholder « Bientôt »

As **Gedeonkp**,
I want **basculer entre Sketch et UML via le rail gauche**,
So that **j'accède au mode diagramme structuré quand il est prêt**.

**Acceptance Criteria:**

**Given** l'atelier ouvert
**When** je clique l'icône UML du rail
**Then** le mode UML devient actif avec indicateur visuel inverse (UX-DR6)

**Given** draw.io non intégré au MVP
**When** j'ouvre l'onglet UML
**Then** un message calme « Bientôt » s'affiche avec retour Sketch possible (FR-8, UX-DR11, Plan A brief)

**Given** draw.io intégré *(si le temps)*
**When** j'ouvre l'onglet UML
**Then** l'embed draw.io charge un diagramme distinct du sketch Excalidraw (FR-8)

**Given** un switch Sketch ↔ UML
**When** je change de mode
**Then** le Projet reste ouvert et les diagrammes sketch ne sont pas perdus (UX-DR6)
