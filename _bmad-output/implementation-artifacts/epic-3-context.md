# Epic 3 Context: Assistant IA OpenRouter (benchmark 3 jours)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Cet epic intègre un assistant IA via OpenRouter dans Fun : Gedeonkp peut dialoguer avec l'IA pour modifier et relire ses diagrammes, ou générer un diagramme UML depuis le code source de son projet. Un benchmark automatique tous les 3 jours sélectionne le meilleur modèle `:free`, garantissant qualité sans coût. C'est le cœur « IA » de Fun — sans cet epic, l'application reste un éditeur de diagrammes classique.

## Stories

- Story 3.1: Configurer la clé OpenRouter et modèle par défaut
- Story 3.2: Benchmark automatique OpenRouter tous les 3 jours
- Story 3.3: Converser avec l'Assistant dans le Chat
- Story 3.4: Modifier le diagramme via l'Assistant
- Story 3.5: Relecture et repartir de zéro
- Story 3.6: Générer un diagramme depuis le code (multi-langue)

## Requirements & Constraints

- **OpenRouter unique** (AD-2) : pas de providers concurrents (Ollama, GCP). Seuls les modèles `:free` sont éligibles. Clé API stockée hors WebView via Tauri secure store.
- **Quota free** : ≤5 scénarios × N modèles par run benchmark pour respecter les 50 req/jour OpenRouter.
- **Fonctionne hors-ligne** (NFR-6) : si Fun offline, le dernier `active_model` persisté reste utilisable. Benchmark reporté si pas de réseau.
- **Sécurité clé** (AD-2, NFR-4) : la clé `sk-or-…` ne transite jamais par le WebView. Seul le code Rust l'utilise.
- **Validation stricte** (AD-7) : le JSON Excalidraw retourné par l'IA est validé avant d'être appliqué ou sauvegardé. Sortie invalide → erreur UI, aucun fichier écrit.

## Technical Decisions

- **Architecture 3 couches** : UI (Next.js/React) → Platform (Tauri Rust) → External (OpenRouter API). Toute l'IA passe par des Tauri commands (`chat_completion`, `run_benchmark`). Le WebView n'appelle jamais OpenRouter directement (AD-1).
- **BenchmarkRunner** (Rust, `src-tauri/ai/benchmark.rs`) : évalue chat, validité JSON diagramme, smoke code→UML. Résultat dans `.fun/ai.json` : `active_model`, `last_benchmark_at`, `last_scores`.
- **AiExtractor** (Rust, `src-tauri/ai/extractor/ai_extractor.rs`) : scan read-only du dossier projet, envoie les chunks à OpenRouter, valide le JSON, écrit `.fun/diagrams/uml-<iso8601>.excalidraw`. TreeSitterExtractor est **différé** — le MVP ship uniquement l'extracteur IA.
- **Diagramme reset** (AD-6) : `reset_diagram` écrase le fichier courant avec un document Excalidraw vide au même chemin (pas de suppression, pas de nouveau fichier).
- **Modèle seed** : avant le premier benchmark, un modèle `:free` codé en dur est utilisé comme fallback.
- **Données** : `.fun/ai.json` contient le modèle actif et les scores. `.fun/diagrams/` contient les diagrammes. Taux `snake_case`, timestamps ISO 8601 UTC.

## UX & Interaction Patterns

- **Chat panel** (sidebar droite, 320px) : repliable pour maximiser le canvas. Thread avec historique de session visible. Indicateur « IA en cours » pendant le streaming des réponses (UX-DR7).
- **Modification IA** (FR-4) : l'utilisateur demande explicitement une modification dans le chat → l'assistant renvoie un JSON Excalidraw valide appliqué au canvas. Le canvas reste éditable manuellement après l'application.
- **Relecture** (UJ-2) : « Qu'est-ce qui cloche ? » → retour textuel + modifications possibles. « Repartir de zéro » → reset du diagramme.
- **Code→UML** (UJ-3) : bouton toolbar « Depuis le code » → scan du dossier, génération, ouverture du diagramme sur canvas ou dans la liste. Cas edge : repo sans fichiers source reconnus → message calme « Aucun fichier source trouvé ».
- **Microcopy** : ton français calme et direct. Messages d'erreur explicites (pas de stack trace brute).
- **Layout** : chat ne masque pas le canvas par défaut. Responsive : chat ≥ 280px, rail 48px fixe.

## Cross-Story Dependencies

- **Story 3.1 prerequisite de toutes les autres** : sans clé OpenRouter configurée, aucune fonction IA ne fonctionne.
- **Story 3.2 prerequisite de 3.3–3.6** : le benchmark détermine `active_model` utilisé par chat, modification, relecture et code→UML.
- **3.3 → 3.4** : la conversation chat est le canal d'entrée pour les modifications IA sur le canvas.
- **3.3 → 3.5** : la relecture utilise le même mécanisme chat.
- **3.6 indépendante de 3.3–3.5** : code→UML utilise le même `active_model` et pipeline OpenRouter mais n'a pas besoin du chat actif.
- **Epic 1 (Projet)** : les stories 3.x dépendent d'un projet ouvert (AD-4) pour `.fun/` et le scan code.
- **Epic 2 (Canvas)** : modification et reset supposent qu'Excalidraw est déjà intégré et opérationnel.
