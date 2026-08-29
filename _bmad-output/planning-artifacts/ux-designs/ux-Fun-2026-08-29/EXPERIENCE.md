---
name: Fun
status: final
sources:
  - {planning_artifacts}/briefs/brief-Fun-2026-08-27/brief.md
  - {planning_artifacts}/prds/prd-Fun-2026-08-28/prd.md
  - {planning_artifacts}/ux-designs/ux-Fun-2026-08-29/imports/excalidraw-reference.png
updated: 2026-08-29
---

# Fun — Experience Spine

> Desktop PC (Tauri + Next). Identité visuelle : `DESIGN.md`. PRD : FR-1–FR-8.

## Foundation

**Form-factor :** application **desktop PC** (Tauri), une fenêtre principale. Pas mobile v1.

**UI system :** embed `@excalidraw/excalidraw` pour le canvas Sketch ; draw.io embed pour UML (nice MVP). Chrome Fun (toolbar, chat, accueil) en React + tokens `DESIGN.md`.

**Principe directeur :** le **Canvas reste central** ; Chat et Pomodoro **accompagnent** sans capturer le focus travail.

## Information Architecture

| Surface | Accès | Rôle |
|---|---|---|
| **Accueil** | Lancement app / fermer projet | Projets récents + « Ouvrir un dossier » |
| **Atelier** | Ouvrir projet | Canvas + toolbar + rail + chat + Pomodoro |
| **Sketch** | Icône rail gauche | Canvas Excalidraw (défaut) |
| **UML** | Icône rail gauche | Canvas draw.io ou placeholder « Bientôt » |
| **Chat** | Sidebar droite (toujours en atelier) | Assistant IA — FR-3, FR-4, FR-5 |
| **Pause méditation** | Fin phase travail Pomodoro | Overlay + modale centrée |
| **Props forme** | Sélection sur canvas | Panneau sous le rail (style Excalidraw) |

→ Référence layout : `imports/excalidraw-reference.png`. Tokens : `{DESIGN.md}`.

## Voice and Tone

Microcopy en **français**, ton calme et direct — pas de hype startup.

| Faire | Éviter |
|---|---|
| « Ouvrir un projet » | « Commencez votre aventure ! » |
| « Pause — respirez. » | « SUPER ! C'est l'heure de la détente 🎉 » |
| « L'IA modifie le diagramme… » | Jargon technique non expliqué |
| « Bientôt » (onglet UML non prêt) | Écran d'erreur brut |

## Component Patterns

| Composant | Comportement |
|---|---|
| **Projet card** (accueil) | Clic → ouvre atelier ; chemin dossier en sous-texte |
| **Toolbar** | Outils Excalidraw hérités + actions Fun (code→UML, thème) |
| **Mode rail** | Sketch / UML : une seule mode active ; switch sans perdre le Projet |
| **Chat thread** | Messages user / assistant ; streaming réponses ; contexte diagramme courant |
| **Pomodoro chip** | Clic → config durées ; démarrer ; état visible (travail / pause) |
| **Meditation stack** | Overlay scrim + modale `{DESIGN.md.components.meditation-modal}` ; texte guidé court ; bouton « Reprendre » |

## State Patterns

| État | Surface | Traitement |
|---|---|---|
| Aucun projet | Accueil | Liste vide + CTA ouvrir |
| Projet sans diagramme | Atelier | Canvas vide + hint « Nouveau diagramme » |
| IA en cours | Chat + Canvas | Indicateur dans chat ; changements canvas progressifs (FR-4) |
| Pause Pomodoro | Atelier | Overlay + modale ; canvas non éditable `[ASSUMPTION]` |
| UML indisponible | UML tab | Message « Bientôt » + lien retour Sketch |
| Thème | Global | Toggle toolbar ; persiste local |

## Interaction Primitives

**Souris-first** (desktop) ; clavier Excalidraw hérité pour le canvas.

- **Double-clic accueil** — non requis ; clic simple sur carte projet.
- **Esc** — ferme modale méditation, `[ASSUMPTION]` replie chat si focus dedans.
- **Notifications OS** — fin phase Pomodoro (FR-7) même si fenêtre en arrière-plan.

**Interdit MVP :** collab multi-curseur, jeux en pause (méditation oui).

## Accessibility Floor

- Contraste texte : noir sur beige (clair) et beige sur noir (sombre) — vérifier AA sur `{DESIGN.md.colors}`.
- Modale méditation : focus trap, `Esc` ferme, annonce lecteur d'écran « Pause ».
- Notifications Pomodoro : ne pas être la seule indication (chip timer visible aussi).
- `[ASSUMPTION]` Excalifont lisible à 14px minimum pour corps chat.

## Key Flows

### UJ-1 — Gedeonkp, mardi soir

Gedeonkp ouvre Fun → **Accueil** voit « Fun side-project » en récents → clic → **Atelier** Sketch, toolbar beige/noir, Excalifont. Il crée un diagramme, dessine. Chip Pomodoro en haut à droite : 25 min / 5 min → **Démarrer**. Chat à droite reste disponible mais fermé visuellement s'il n'en a pas besoin. **Climax :** il avance sans alt-tab. **Résolution :** diagramme sauvegardé dans le Projet.

### UJ-2 — Relecture IA

Sur le canvas, diagramme brouillon. Gedeonkp tape dans **Chat** : « Qu'est-ce qui cloche ? » L'Assistant répond et surligne / modifie sur le canvas (FR-4, FR-5). **Climax :** il voit la correction en direct. **Résolution :** il accepte ou dit « repartir de zéro ».

### UJ-3 — Code vers UML

Menu toolbar « Depuis le code » (FR-6). L'Assistant analyse le dossier Projet ; nouveau contenu apparaît sur canvas ou onglet UML. **Climax :** premier diagramme classes visible. **Edge case :** repo vide → message calme « Aucun fichier source trouvé ».

### UJ-4 — Pause méditation (MVP)

Timer Pomodoro atteint zéro → notification OS + **overlay** sur canvas + **modale** centrée texte guidé (respiration courte). Gedeonkp clique « Reprendre » ou timer pause expire. **Résolution :** retour atelier, phase pause ou nouveau cycle travail.

## Responsive & Platform

Desktop uniquement. Fenêtre redimensionnable :
- Chat ≥ 280px ; en dessous `[ASSUMPTION]` chat en overlay drawer.
- Rail 48px fixe ; props panel scrollable si hauteur insuffisante.

## Open Questions

1. Chat repliable par défaut ouvert ou fermé ?
2. Méditation : contenu fixe ou rotation de textes ?
3. Self-host Excalifont : bundle Excalidraw fonts path.
