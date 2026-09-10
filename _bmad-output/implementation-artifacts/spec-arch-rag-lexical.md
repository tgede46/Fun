---
title: 'RAG lexical architecture — Chat + Trace + Claire'
type: feature
created: '2026-09-10'
status: in-progress
review_loop_iteration: 0
baseline_commit: '82c6c7d008920e7f52e1a3f67c6885c75bb3d763'
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/epic-3-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Chat, Trace et Claire n’ont que le diagramme courant (+ historique) — pas le code du Projet ni un savoir architecture (C4, patterns, ADRs). Les réponses restent génériques et peu ancrées dans le Projet.

**Approach:** Ajouter un petit RAG **lexical** (chunks + score BM25/keywords) sur (1) sources du Projet, (2) artefacts `.fun/`, (3) knowledge pack Fun architecture. Injecter le top-k dans le system prompt de `send_chat` uniquement (Assistant / Trace / Claire). Embeddings = phase suivante, hors scope.

## Boundaries & Constraints

**Always:**
- Retrieval 100 % Rust (AD-1) ; WebView n’appelle OpenRouter ni ne lit le disque.
- Écritures index/cache uniquement sous `project_root/.fun/` (AD-4) ; code source hors `.fun/` read-only.
- Injection via `personas::system_prompt` / `send_chat` — pas Atlas (`generate_diagram_from_code`).
- Budget contexte RAG plafonné (ex. ≤6 000 chars total top-k) en plus des caps diagramme existants.
- Microcopy / en-têtes de contexte en français.
- Knowledge pack shippé avec l’app (bundled) + overlay optionnel `.fun/knowledge/`.
- Index lexical cache sous `.fun/rag/` ; rebuild si stale (hash/mtime).

**Ask First:**
- Contenu éditorial exact du knowledge pack au-delà du seed minimal (C4, patterns, AD spine distillés) si l’humain veut une biblio plus large.

**Never:**
- Embeddings / vector DB / appels embedding OpenRouter dans cette story.
- Brancher Atlas / code→UML / benchmark sur ce RAG.
- Indexer `node_modules`, `target`, dossiers dot hors `.fun`.
- Exposer chemins filesystem arbitraires au WebView.
- Diluer les contrats Trace (```excalidraw-json / ```plantuml) — le bloc format reste prioritaire dans le prompt.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Chat avec index prêt | Message user + projet indexé | System prompt contient section « Contexte architecture » avec top-k pertinents | N/A |
| Index absent / stale | Ouverture projet ou 1er chat | Rebuild lexical silencieux (ou au 1er retrieve), puis injection | Échec rebuild → chat sans RAG, log stderr |
| Projet sans sources | Dossier sans extensions reconnues | Knowledge pack (+ `.fun` si présent) seulement | Pas d’erreur UI |
| Query vide / trop courte | Message &lt; 3 tokens utiles | Pas d’injection RAG (ou top knowledge générique minimal) | N/A |
| Trop de hits | Corpus large | Top-k fixe (ex. 5) + tronquage chars | N/A |
| Persona Trace | Demande de modification canvas | RAG injecté **après** instructions format ; JSON/PlantUML toujours exigé | N/A |
| Hors ligne | Pas de réseau | RAG local OK ; seul OpenRouter échoue comme aujourd’hui | Inchangé |

</frozen-after-approval>

## Code Map

- `src-tauri/src/ai/chat.rs` (~29–128) -- `send_chat` : hook retrieve + passer chunks à `system_prompt`
- `src-tauri/src/ai/personas.rs` (3–70) -- étendre `system_prompt` ; réutiliser `truncate_diagram` / même style de cap
- `src-tauri/src/ai/intent.rs` (47–80) -- `detect_persona` : filtrage optionnel des kinds selon Claire/Trace/Assistant
- `src-tauri/src/project/code_extract.rs` (6–47) -- réutiliser règles extensions / ignore (40 fichiers, 8 Ko, 48 Ko) pour le scan RAG ; **ne pas** casser Atlas
- `src-tauri/src/project/ai_config.rs` -- pattern `read_*`/`write_*` + `create_dir_all` à mirroir pour manifest RAG
- `src-tauri/src/project/init.rs` (84–109) -- seed éventuel `.fun/knowledge/` / `.fun/rag/` via `write_if_missing`
- `src-tauri/src/commands.rs` (`send_chat_message` ~452–478) -- pas de changement payload si retrieve server-side ; commands debug optionnelles
- `src/lib/ai.ts` / `WorkshopLayout.tsx` -- **read-only** sauf toggle UI explicite (non requis MVP)
- **Nouveau** `src-tauri/src/rag/` -- `scan`, `chunk`, `lex`, `index`, `retrieve`, `types`
- **Nouveau** knowledge pack -- `src-tauri/resources/knowledge/` ou `include_str!` (C4, patterns, AD distillés)
- **Read-only** `client.rs`, `benchmark.rs`, `generate_diagram_from_code`

## Tasks & Acceptance

**Execution:**
- [ ] `src-tauri/src/rag/` -- Module lexical : chunker, index inverted, `retrieve(query, top_k)`, persist `.fun/rag/` -- cœur du RAG
- [ ] `src-tauri/resources/knowledge/` -- Seed pack architecture (C4 + patterns + AD Fun distillés, FR) -- corpus B
- [ ] `src-tauri/src/ai/personas.rs` -- Section « Contexte architecture » + cap chars ; Trace format intact -- injection
- [ ] `src-tauri/src/ai/chat.rs` -- Appeler retrieve avant `system_prompt` pour Assistant/Trace/Claire -- câblage
- [ ] `src-tauri/src/project/init.rs` + `ai_config`-like helpers -- Créer `.fun/rag/` ; rebuild stale -- cycle de vie
- [ ] `src-tauri/src/commands.rs` + permissions -- `get_rag_index_status` + `rebuild_rag_index` (debug/ops) -- observabilité
- [ ] `src-tauri/src/rag/` tests -- Couvrir matrice I/O (empty corpus, stale, top-k, truncate) -- vérif

**Acceptance Criteria:**
- Given un Projet indexé et une clé OpenRouter, when l’utilisateur envoie un message chat (Assistant, Trace ou Claire), then le prompt système inclut des extraits architecture/code pertinents (FR) sans casser le format Trace.
- Given un Projet sans index, when le premier chat part, then l’index lexical est construit sous `.fun/rag/` sans écrire hors `.fun/`.
- Given Atlas code→UML, when on génère un diagramme, then le flux reste sur `scan_project_sources` (pas ce RAG).
- Given embeddings, when on lit ce spec, then ils restent hors scope (phase hybride suivante).

## Spec Change Log

## Design Notes

**Injection (ordre prompt) :** persona base → **Contexte architecture (RAG)** → diagrammes sélectionnés → diagramme courant. Ainsi Trace garde ses règles de format en tête.

**Exemple section RAG :**
```
Contexte architecture (extrait Projet + knowledge Fun) :
--- patterns/hexagonal.md ---
...
--- src/domain/mod.rs ---
...
```

**Score lexical MVP :** tokenization simple + TF des termes de la query (BM25 allégé OK) ; pas de dépendance NLP lourde.

**Embeddings (plus tard) :** même `RetrievedChunk` + store sous `.fun/rag/` ; swap derrière `retrieve`.

## Verification

**Commands:**
- `cd src-tauri && cargo test rag::` -- expected: tests module RAG verts
- `cd src-tauri && cargo test ai::` -- expected: personas/chat existants toujours verts
- `cd src-tauri && cargo check` -- expected: compile OK

**Manual checks:**
- Ouvrir un Projet, chatter « quelle est la frontière Tauri/Next ? » → réponse ancrée knowledge AD-1
- Demander à Trace une modif canvas → bloc ```excalidraw-json toujours présent
- Vérifier `.fun/rag/` créé ; aucune écriture hors `.fun/`
