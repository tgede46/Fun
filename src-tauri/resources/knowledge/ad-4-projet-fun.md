# AD-4 — Périmètre Projet et `.fun/`

Ouvrir un dossier lie `project_root`. Les artefacts Fun vivent uniquement sous `project_root/.fun/` :
`project.json`, `settings.json`, `ai.json`, `diagrams/*.excalidraw`, `rag/`, `knowledge/`.

Le code source hors `.fun/` est **lecture seule** (scan code→UML / RAG). Fun n'écrit jamais hors du Projet ouvert.
