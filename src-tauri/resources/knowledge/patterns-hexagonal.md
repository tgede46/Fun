# Pattern — Hexagonal / ports

Pour un atelier logiciel : isoler le cœur (règles métier, validation JSON Excalidraw) des adaptateurs (OpenRouter, FS, UI).

Ports typiques Fun : `CodeExtractor`, client chat, persistance diagrammes. Tree-sitter ou embeddings se branchent sans changer le contrat UI.

Utiliser ce pattern pour discuter découplage, testabilité et remplacement d'un fournisseur IA.
