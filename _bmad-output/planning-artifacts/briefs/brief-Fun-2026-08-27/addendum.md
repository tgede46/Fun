# Addendum — Fun (hors brief)

Détail utile pour PRD / architecture ; hors du brief exécutif.

## État réel du produit (2026-08-31)

Le produit est déjà orienté vers une implémentation concrète, et la brief doit refléter cet état réel plutôt qu’un cadrage purement aspirational.

- Front / shell : Next.js + **Tauri** sur desktop PC
- Interface principale : atelier projet avec accueil, écran de projet ouvert et layout d’édition
- Canvas : `@excalidraw/excalidraw` embarqué localement
- IA : OpenRouter via Tauri, avec sélection du modèle actif depuis `project/.fun/ai.json`
- Benchmark : exécution automatique selon modèle `:free`, avec mise à jour de l’état IA
- Clavier de travail : Pomodoro, notifications OS, pause méditation avec overlay
- Périmètre : un seul dossier ouvert à la fois, sans accès au filesystem complet

## Principes de conception retenus

- **Projet-scoped** : Fun ne travaille que dans un dossier ouvert et dans son sous-répertoire `.fun/`
- **Desktop-first** : l’application est conçue pour le poste, pas pour mobile
- **Offline-safe** : le sketch et le Pomodoro fonctionnent sans dépendance internet forte
- **IA-first dans le contexte** : le chat et les générateurs sont utiles dans l’atelier, pas en dehors
- **Simplicité d’usage** : le but est de rester concentré sans reconstruire un workflow à chaque fois

## MoSCoW (mise à jour)

- **Must** : ouverture de projet, atelier, canvas Excalidraw, chat IA, génération/modification de diagramme, benchmark IA, pomodoro
- **Should** : code vers diagramme, onglet UML, thématiques de thème clair/sombre et accessibilité
- **Could** : intégrations externes et fonctions plus avancées de partage
- **Won’t** : mobile, backend dédié, accès large au PC, collaboration multipartite dans la version MVP

## Contraintes temps et périmètre

- MVP conçu pour un usage personnel et rapide
- Le produit n’a pas pour ambition d’être un logiciel d’entreprise complet
- La priorité est la fiabilité du flux principal, pas la richesse fonctionnelle immédiate

## Sources

- Implémentation fonctionnelle de l’application : `src/`, `src-tauri/`, composants de l’atelier
- Documents de cadrage du projet : `_bmad-output/planning-artifacts/`
- Session brief coaching : `.memlog.md` de ce dossier
