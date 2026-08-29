---
title: 'Story 3.4 — Modifier le diagramme via l\'Assistant'
type: feature
created: '2026-08-29'
status: done
baseline_commit: NO_VCS
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/epic-3-context.md
  - _bmad-output/implementation-artifacts/spec-3-3-chat-assistant-ia.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'utilisateur peut talkuer avec l'IA mais ses demandes de modification (ex. « ajoute une boîte API ») ne prennent pas effet sur le canvas — le JSON Excalidraw retourné par l'assistant n'est ni parsé ni appliqué.

**Approach:** Quand le chat délivre un champ `diagram_update` (JSON Excalidraw valide), le frontend l'applique au canvas Excalidraw en cours via l'API de l'embed. Le canvas reste éditable manuellement après l'application. La modification est persistée par le debounce de save existant.

## Boundaries & Constraints

**Always:**
- L'application du JSON ne se fait que si l'utilisateur a explicitement demandé une modification (pas automatique sur chaque réponse) — le champ `diagram_update` est déjà signalé par `SendChatResult`.
- Le JSON est validé côté Rust (`diagram::validate_excalidraw_json`) avant d'arriver au frontend — le frontend de confiance mais sans ré-validation lourde.
- Après application, le canvas reste éditable (FR-4) — pas de locking.
- La modification persistée via `save_diagram` debounced existant (story 2.3).

**Ask First:**
- Aucun.

**Never:**
- Remplacer le canvas entier sans que l'utilisateur n'ait demandé une modification.
- Appliquer des modifications en dehors du panneau chat (ex. depuis le chat d'une autre session).
- Supposer que tout JSON valide est sûr — la validation Rust est le garde-fou.

## I/O & Edge-Case Matrix

|| Scenario | Input / State | Expected Output / Behavior | Error Handling |
||----------|--------------|---------------------------|----------------|
|| Modification demandée | Message utilisateur de type « ajoute… », « modifie… » | Assistant renvoie JSON dans `diagram_update` | Si JSON absent → pas d'application, juste texte |
|| JSON valide reçu | `diagram_update` présent et valide | Canvas monté avec le nouveau JSON Excalidraw | N/A |
|| Canvas après modification | État post-apply | L'utilisateur peut continuer à dessiner manuellement | N/A |
|| Diagramme non ouvert | Pas de `diagram_path` actif | Modificiation ignorée — message UI « Ouvrez un diagramme pour appliquer » | N/A |
|| JSON invalide (si contournement) | `diagram_update` malformé | Pas d'application, erreur console/logique | Le Rust valide avant — cas défensive |
|| Changement manuel après IA | Dessin ultérieur sur canvas | Save debounced persiste le résultat mixte | N/A |

</frozen-after-approval>

## Code Map

- `src-tauri/src/commands.rs` — `send_chat_message` (ligne 237) : retourne `SendChatResult` avec champ `diagram_update: Option<String>`.
- `src-tauri/src/ai/chat.rs` — `send_chat()` (ligne 25) : produit `diagram_update` quand le persona est `Editeur` et le JSON est valide (lignes 88–114).
- `src-tauri/src/ai/chat.rs` — `parse_assistant_response()` (ligne 88) : extrait le JSON du fence ````excalidraw-json`.
- `src-tauri/src/ai/chat.rs` — `extract_excalidraw_fence()` (ligne 116) : parsing du fence.
- `src-tauri/src/project/diagram.rs` — `validate_excalidraw_json()` : validation du JSON avant envoi (à adapter si besoin — à checker dans le module).
- `src/components/workshop/ChatPanel.tsx` — **update** : détecter `result.diagram_update` et appliquer au canvas.
- `src/components/workshop/ExcalidrawCanvas.tsx` — **update** : exposer méthode `applyScene(json: string)` pour reception des mises à jour IA.
- `src/components/workshop/WorkshopLayout.tsx` — **update** : relayer `diagram_update` de ChatPanel vers ExcalidrawCanvas.
- `src/lib/ai.ts` — type `SendChatResult` avec `diagram_update` déjà défini côté Rust.

## Tasks & Acceptance

**Execution:**
- [ ] `src/components/workshop/ExcalidrawCanvas.tsx` — ajouter une méthode/props pour appliquer un nouveau scène JSON (ex. `applyExcalidrawUpdate(json)`).
- [ ] `src/components/workshop/ChatPanel.tsx` — après réception `SendChatResult`, si `diagram_update` présent, appeler `applyExcalidrawUpdate` sur le canvas.
- [ ] `src/components/workshop/WorkshopLayout.tsx` — connecter ChatPanel et ExcalidrawCanvas pour le passage de mise à jour.
- [ ] Vérifier que le debounce de save (story 2.3) persiste automatiquement la modification appliquée.

**Acceptance Criteria:**
- Given un diagramme avec contenu et le Chat actif, when l'utilisateur demande explicitement une modification (ex. « ajoute une boîte API »), then l'Assistant renvoie un JSON Excalidraw valide appliqué au canvas.
- Given une modification IA appliquée, when l'utilisateur continue à dessiner manuellement, then l'embed Excalidraw reste éditable.
- Given une modification IA appliquée, when le debounce déclenche, then `save_diagram` persiste le résultat dans `.fun/diagrams/`.

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` — expected: exit 0
- `npm run build` — expected: exit 0
- `cargo test --lib ai::chat` — expected: pas de régression

**Manual checks:**
- `npm run tauri dev` : ouvrir un diagramme, demander « ajoute un rectangle rouge » dans le chat, vérifier que le rectangle apparaît sur le canvas.
- Dessiner manuellement après — le canvas reste réactif.
- Fermer le chat, rouvrir — la modification persistée est visible.

## Suggested Review Order

**Application canvas**
- Point d'entrée : méthode `applyExcalidrawUpdate` sur l'embed.
  [`ExcalidrawCanvas.tsx`](../../src/components/workshop/ExcalidrawCanvas.tsx)

**Parsing côté Rust**
- `parse_assistant_response` avec extraction fence ````excalidraw-json`.
  [`chat.rs:88`](../../src-tauri/src/ai/chat.rs#L88)

**Orchestration frontend**
- ChatPanel détecte `diagram_update` et relaye vers le canvas.
  [`ChatPanel.tsx`](../../src/components/workshop/ChatPanel.tsx)
