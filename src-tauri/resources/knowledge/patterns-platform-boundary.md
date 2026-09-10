# Pattern — Platform boundary

Séparer clairement présentation et plateforme :
1. Le WebView ne détient ni secrets ni accès filesystem large.
2. Les commandes Tauri exposent un contrat stable (`snake_case`).
3. Le domaine (diagrammes, IA, timer) orchestre côté Rust.

Évite les fuites de clé API et les écritures hors Projet. Préférer des adaptateurs ennuyeux et testables.
