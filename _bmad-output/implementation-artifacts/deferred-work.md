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
