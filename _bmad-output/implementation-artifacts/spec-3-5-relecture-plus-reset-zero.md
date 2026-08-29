---
title: 'Story 3.5 — Relecture et repartir de zéro'
type: feature
created: '2026-08-29'
status: pending
baseline_commit: NO_VCS
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/epic-3-context.md
  - _bmad-output/implementation-artifacts/spec-3-3-chat-assistant-ia.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'utilisateur peut avoir un diagramme douteux mais n'a pas de moyen de demander un regard extérieur à l'IA, ni de repartir de zéro sans quitter l'atelier et re-créer un diagramme vide.

**Approach:** L'utilisateur demande « qu'est-ce qui cloche ? » ou « repartir de zéro » dans le chat. Pour la relecture, l'Assistant produit un retour textuel sur le diagramme courant. Pour le reset, `reset_diagram` écrase le fichier courant avec un document Excalidraw vide au même chemin (AD-6). Le reset est détecté par `is_reset_request()` dans `intent.rs`.

## Boundaries & Constraints

**Always:**
- Reset = écrasement du fichier, pas suppression ni nouveau fichier (AD-6). L'ID et le nom du diagramme restent inchangés.
- La relecture est purely textuelle — pas de modification automatique du canvas (cela relève de story 3.4 si l'utilisateur valide ensuite).
- Reset ne nécessite pas confirmation — l'utilisateur a explicitement demandé « repartir de zéro ».
- Le reset doit fonctionner même si le diagramme n'a pas encore été sauvegardé (le fichier existe via `create_diagram`).

**Ask First:**
- Aucun.

**Never:**
- Reset sans diagramme ouvert — erreur claire UI.
- Modification automatique du canvas suite à une relecture (par défaut).
- Supprimer le fichier `.excalidraw` — le reset le remplace par un vide canonique.

## I/O & Edge-Case Matrix

|| Scenario | Input / State | Expected Output / Behavior | Error Handling |
||----------|--------------|---------------------------|----------------|
|| Relecture demandée | « qu'est-ce qui cloche ? », « comment améliorer ? » | Assistant renvoie un texte de retour sur le diagramme | Si pas de diagramme → erreur UI |
|| Reset demandé | « repartir de zéro », « reset », « tout effacer » | `reset_diagram` écrase le fichier avec JSON vide, message confirmé | Si pas de diagramme → erreur UI |
|| Reset avec diagramme modifié non sauvegardé | Canvas avec dessins non persistés | Reset écrasé le fichier sur disque — contenu en mémoire perdu | Avertissement subtil ? (à décider UX) |
|| Reset appliqué | Fichier écrassé avec vide | Canvas rechargé avec le document vide, liste diagrammes inchangée | N/A |
|| Relecture avec contexte diagramme | `diagram_content` passé au prompt système | L'IA voit le contenu du diagramme dans le prompt | Si pas de contenu → relecture générique |

</frozen-after-approval>

## Code Map

- `src-tauri/src/commands.rs` — `reset_diagram` (ligne 265) : commande Tauri existante, appelle `diagram::reset_diagram()`.
- `src-tauri/src/ai/chat.rs` — `send_chat()` (ligne 25) : détecte `is_reset_request(user_message)` (ligne 36) et appelle `diagram::reset_diagram()`.
- `src-tauri/src/ai/intent.rs` — `is_reset_request()` : classification des mots-clés reset.
- `src-tauri/src/ai/intent.rs` — `detect_persona()` : classification relecteur quand l'utilisateur demande une relecture.
- `src-tauri/src/project/diagram.rs` — `reset_diagram()` : **à implémenter** — écrase le fichier avec `empty_excalidraw_json()` au même chemin.
- `src-tauri/src/project/diagram.rs` — `empty_excalidraw_json()` (ligne 21) : document Excalidraw vide canonique.
- `src/components/workshop/ChatPanel.tsx` — **update** : afficher le résultat avec indication de reset appliqué.
- `src/components/workshop/ExcalidrawCanvas.tsx` — **update** : recharger le contenu lorsque `diagram_reset: true` est reçu.
- `src/components/workshop/WorkshopLayout.tsx` — **update** : orchestrer le rechargement du canvas après reset.

## Tasks & Acceptance

**Execution:**
- [ ] `src-tauri/src/project/diagram.rs` — implémenter `reset_diagram(project_root, diagram_path)` qui écrase le fichier avec `empty_excalidraw_json()`.
- [ ] `src-tauri/src/project/diagram.rs` — tester `reset_diagram` : fichier écrassé, contenu vide, même chemin, même nom.
- [ ] `src/components/workshop/ExcalidrawCanvas.tsx` — charger le nouveau contenu vide lorsque `diagram_reset: true` est reçu du chat.
- [ ] `src/components/workshop/ChatPanel.tsx` — afficher le message de confirmation reset ou le texte de relecture.
- [ ] `ChatPanel.tsx` — gérer le cas où le reset est demandé sans diagramme ouvert (erreur UI).

**Acceptance Criteria:**
- Given un diagramme ouvert, when l'utilisateur demande « qu'est-ce qui cloche ? », then l'Assistant produit un retour textuel sur le diagramme courant.
- Given un diagramme ouvert, when l'utilisateur demande « repartir de zéro », then `reset_diagram` écrase le fichier avec un Excalidraw vide au même chemin.
- Given un reset appliqué, when le canvas se recharge, then le diagramme affiche un canvas vide (même fichier, même nom dans la liste).

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` — expected: exit 0
- `npm run build` — expected: exit 0
- `cargo test --lib project::diagram` — expected: nouveau test reset_diagram passant

**Manual checks:**
- `npm run tauri dev` : ouvrir un diagramme avec du contenu, taper « repartir de zéro » dans le chat, vérifier que le canvas devient vide et que le fichier est écrasé.
- Lister les diagrammes — le nom du fichier reset est toujours présent.
- Tirter « qu'est-ce qui cloche ? » — obtenir un retour textuel sans modification du canvas.

## Suggested Review Order

**Reset côté Rust**
- `reset_diagram` : écrasement du fichier avec JSON vide canonique.
  [`diagram.rs`](../../src-tauri/src/project/diagram.rs)

**Détection reset dans le chat**
- `is_reset_request()` et branchement dans `send_chat()`.
  [`chat.rs:36`](../../src-tauri/src/ai/chat.rs#L36)

**Rechargement frontend**
- `diagram_reset: true` → rechargement canvas vide.
  [`ExcalidrawCanvas.tsx`](../../src/components/workshop/ExcalidrawCanvas.tsx)
