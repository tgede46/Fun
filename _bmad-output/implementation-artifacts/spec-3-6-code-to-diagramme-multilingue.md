---
title: 'Story 3.6 — Générer un diagramme depuis le code (multi-langue)'
type: feature
created: '2026-08-29'
status: done
baseline_commit: NO_VCS
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/epic-3-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'utilisateur a du code dans son projet mais doit dessiner manuellement un diagramme de classes ou de modules — pas de génération automatique depuis les fichiers source.

**Approach:** Bouton « Depuis le code » dans la toolbar lance un scan read-only du dossier projet, envoie les chunks à OpenRouter via `AiExtractor`, valide le JSON Excalidraw retourné, et écrit le résultat dans `.fun/diagrams/uml-<iso8601>.excalidraw`. Le diagramme s'ouvre sur le canvas ou apparaît dans la liste. Multi-langue : l'extracteur scanne toutes les extensions supportées (.ts, .py, .java, .rs, etc.) et le pipeline IA-first produit un diagramme sans parser spécifique par langue (TreeSitter deferred).

## Boundaries & Constraints

**Always:**
- Scan read-only du dossier projet — pas d'écriture hors `.fun/` (AD-4, AD-7).
- Sortie dans `.fun/diagrams/uml-<iso8601>.excalidraw` (AD-7) — nom unique par timestamp.
- Validation stricte du JSON Excalidraw avant écriture — sortie invalide → erreur UI, aucun fichier écrit (AD-7).
- Pipeline IA-first uniquement au MVP — pas de TreeSitter ni de parser par langue (AD-7, deferred).
- Le diagramme généré s'ouvre sur le canvas ou apparaît dans la liste — les deux sont aceptables (FR-6, SM-2).

**Ask First:**
- Aucun.

**Never:**
- Écrire des fichiers de sortie hors `.fun/diagrams/`.
- Ignorer la validation JSON — jamais d'écriture sans validation.
- Scanner plus de 40 fichiers ou 48 000 octets de code (limite déjà dans `code_extract.rs`).

## I/O & Edge-Case Matrix

|| Scenario | Input / State | Expected Output / Behavior | Error Handling |
||----------|--------------|---------------------------|----------------|
|| Génération réussie | Projet avec fichiers source | Fichier `uml-<iso8601>.excalidraw` écrit, ouvert sur canvas ou dans liste | N/A |
|| Aucun fichier source | Repo sans fichiers reconnus | Message « Aucun fichier source trouvé » (UX-DR12) | N/A |
|| Réponse modèle invalide | JSON Excalidraw incorrect ou absent | Aucun fichier écrit, message d'erreur clair | Pas de fichier corrompu |
|| Projet sans `.fun/` | Projet ouvert mais `.fun/` absent | Génération peut quand même écrire — `.fun/` créé si nécessaire | Déjà géré par `ensure_fun_structure` |
|| Timeout ou erreur réseau | OpenRouter ne répond pas | Erreur UI, pas de fichier écrit | Retry non — l'utilisateur réessaye |
|| Quota dépassé | 429 Too Many Requests | Erreur UI, pas de fichier écrit | N/A |

</frozen-after-approval>

## Code Map

- `src-tauri/src/commands.rs` — `generate_diagram_from_code()` (ligne 272) : commande Tauri existante.
- `src-tauri/src/ai/chat.rs` — `generate_diagram_from_code()` (ligne 124) : orchestration scan, prompt, appel IA, validation, écriture.
- `src-tauri/src/ai/chat.rs` — `extract_json_payload()` (ligne 160) : parsing du JSON de la réponse.
- `src-tauri/src/project/code_extract.rs` — `scan_project_sources()` (ligne 14) : scan read-only du dossier, limites 40 fichiers / 48 000 octets.
- `src-tauri/src/project/diagram.rs` — `write_uml_diagram()` : **à implémenter** — écrit le JSON validé dans `.fun/diagrams/uml-<iso8601>.excalidraw`.
- `src-tauri/src/project/diagram.rs` — `validate_excalidraw_json()` : validation du JSON avant écriture.
- `src/components/workshop/Toolbar.tsx` — **update** : bouton « Depuis le code » dans la toolbar.
- `src/components/workshop/WorkshopLayout.tsx` — **update** : handler pour déclencher `generate_diagram_from_code` et ouvrir le résultat.
- `src/lib/ai.ts` — helper `invoke('generate_diagram_from_code', { projectPath })`.
- `src/components/workshop/DiagramList.tsx` — **update** : le nouveau diagramme apparaît dans la liste après génération.

## Tasks & Acceptance

**Execution:**
- [ ] `src-tauri/src/project/diagram.rs` — implémenter `write_uml_diagram(project_root, json)` qui écrit dans `.fun/diagrams/uml-<iso8601>.excalidraw`.
- [ ] `src-tauri/src/project/diagram.rs` — tester `write_uml_diagram` : fichier créé, contenu valide, nom avec timestamp ISO.
- [ ] `src/components/workshop/Toolbar.tsx` — bouton « Depuis le code » visible en atelier.
- [ ] `src/components/workshop/WorkshopLayout.tsx` — invoquer `generate_diagram_from_code`, gérer succès (ouvrir diagramme) et échec (message UI).
- [ ] Cas edge : repo sans fichiers source → message calme dans l'UI.
- [ ] Cas edge : réponse IA invalide → pas de fichier écrit, message d'erreur explicite.

**Acceptance Criteria:**
- Given un Projet avec fichiers source (.ts, .py, .java, .rs, etc.) hors `.fun/`, when l'utilisateur déclenche « Depuis le code » dans la toolbar, then Tauri scanne read-only le dossier, envoie les chunks à OpenRouter via `AiExtractor`, valide le JSON Excalidraw et écrit `.fun/diagrams/uml-<iso8601>.excalidraw`.
- Given le diagramme généré, when la génération réussit, then il s'ouvre sur le canvas ou apparaît dans la liste des diagrammes.
- Given un repo sans fichiers source reconnus, when l'utilisateur lance la génération, then le message « Aucun fichier source trouvé » s'affiche.
- Given une réponse modèle invalide (JSON Excalidraw incorrect), when la génération échoue la validation, then aucun fichier n'est écrit et une erreur claire s'affiche.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` — expected: exit 0
- `npm run build` — expected: exit 0
- `cargo test --lib project::diagram` — expected: nouveau test `write_uml_diagram` passant
- `cargo test --lib project::code_extract` — expected: tests existants passent

**Manual checks:**
- `npm run tauri dev` : ouvrir un projet avec du code source, cliquer sur « Depuis le code », vérifier qu'un fichier `uml-*.excalidraw` est créé dans `.fun/diagrams/`.
- Le diagramme s'ouvre sur le canvas ou est visible dans la liste.
- Supprimer tous les fichiers source du projet, relancer — message « Aucun fichier source trouvé ».
- Décocher temporairement le réseau — la génération échoue avec message clair, pas de fichier écrit.

## Suggested Review Order

**Écriture du fichier sortant**
- `write_uml_diagram` : timestamp ISO, écriture validée, chemin `.fun/diagrams/`.
  [`diagram.rs`](../../src-tauri/src/project/diagram.rs)

**Scan read-only**
- `scan_project_sources` : limites, exclusions `.fun/`, `node_modules`, `target`.
  [`code_extract.rs:14`](../../src-tauri/src/project/code_extract.rs#L14)

**Pipeline IA**
- `generate_diagram_from_code` : prompt, appel, extraction JSON, validation.
  [`chat.rs:124`](../../src-tauri/src/ai/chat.rs#L124)

**UI génération**
- Toolbar bouton + WorkshopLayout handler + DiagramList refresh.
  [`Toolbar.tsx`](../../src/components/workshop/Toolbar.tsx)
