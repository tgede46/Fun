- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-home-recent-projects.md`
  summary: Ajouter tests automatisés (React + Rust) pour la matrice I/O accueil/recents.
  evidence: Revue verification-gap — aucun test framework au MVP ; `npm run build` ne couvre pas les flux Tauri.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-home-recent-projects.md`
  summary: Valider le path projet côté atelier pour navigation directe `/workshop?path=`.
  evidence: Edge-case hunter — atelier affiche tout path sans `remember_recent_project` ni validation disque.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-home-recent-projects.md`
  summary: Canonicaliser les chemins recents pour éviter doublons (symlinks, spellings).
  evidence: Edge-case hunter — même dossier peut apparaître plusieurs fois.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-home-recent-projects.md`
  summary: Écriture atomique du store JSON recents.
  evidence: Edge-case hunter — crash pendant `fs::write` peut corrompre le fichier.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-home-recent-projects.md`
  summary: Appliquer Excalifont sur les cartes accueil selon DESIGN.md.
  evidence: Revue blind-hunter — globals.css utilise Segoe UI, pas la typo UX.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-benchmark-openrouter-auto.md`
  summary: Paralléliser les appels API benchmark (3 scénarios par modèle en //, modèles en // avec concurrence limitée).
  evidence: Revue blind-hunter — 15 appels séquentiels = minutes de wall-clock ; les scénarios par modèle sont indépendants.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-benchmark-openrouter-auto.md`
  summary: Ajouter retry avec backoff sur les réponses HTTP 429 (rate limit OpenRouter).
  evidence: Revue blind-hunter — les modèles free retournent souvent 429 ; un modèle capable est scored à 0 faussement.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-benchmark-openrouter-auto.md`
  summary: Rendre CANDIDATE_MODELS et BENCHMARK_STALENESS_DAYS configurables via .fun/ai.json ou un fichier externe.
  evidence: Revue blind-hunter — modifying constants requires recompilation.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-benchmark-openrouter-auto.md`
  summary: Ajouter un garde-fou concurrence (Mutex) sur run_benchmark pour éviter les écritures simultanées à ai.json.
  evidence: Revue edge-case-hunter — deux appels concurrents corrompent le fichier config.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-benchmark-openrouter-auto.md`
  summary: Améliorer compute_score avec une échelle graduée (logarithmique) pour la taille réponse au lieu d'un step binaire.
  evidence: Revue blind-hunter — "pong" (5 bytes) et réponse détaillée (4999 bytes) obtiennent le même score taille.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-benchmark-openrouter-auto.md`
  summary: Valider le champ `version` (==2) dans is_valid_excalidraw_json pour reject les schémas futurs.
  evidence: Revue blind-hunter — toute réponse avec `type:"excalidraw"` et `elements:[]` passe, même version 999.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-benchmark-openrouter-auto.md`
  summary: Ajouter tests async pour check_and_run_if_stale (mock/stub du benchmark, casFresh/Failed/stale).
  evidence: Revue verification-gap — aucune couverture test pour l'orchestrateur principal ; 4 lignes de la matrice I/O non vérifiées.
