# Deferred work

Items Story 1.2 clos par `spec-1-2-hardening-tests-canonical-atomic-font.md` (status: done).

Aucun item ouvert.

## Clos

- Tests automatisés (React + Rust) matrice I/O accueil/recents — `src/test/home-screen.test.tsx`, `src-tauri/src/recent.rs`.
- Validation path atelier `/workshop?path=` via `open_project` (Story 1.3) — `src/app/workshop/page.tsx`.
- Écriture atomique du store JSON recents — `recent.rs` tmp + rename.
- Excalifont sur les cartes accueil — héritage `--fun-typography-ui-family`.

- source_spec: `_bmad-output/implementation-artifacts/spec-arch-rag-lexical.md`
  summary: Embeddings / vector store (phase hybride suivante du RAG).
  evidence: Spec Never + Approach — lexical only in this story.

- source_spec: `_bmad-output/implementation-artifacts/spec-arch-rag-lexical.md`
  summary: UI frontend pour statut/rebuild RAG et helpers `src/lib`.
  evidence: Commands Tauri exposées ; pas de binding WebView requis au MVP.

- source_spec: `_bmad-output/implementation-artifacts/spec-arch-rag-lexical.md`
  summary: Rebuild index async / non-bloquant sur le chemin send_chat.
  evidence: Edge-case hunter — rebuild synchrone peut retarder le chat sur gros projets.

- source_spec: `_bmad-output/implementation-artifacts/spec-arch-rag-lexical.md`
  summary: Lecture bornée (take N bytes) pour éviter OOM sur fichiers géants.
  evidence: Edge-case hunter — read_to_string avant truncate.