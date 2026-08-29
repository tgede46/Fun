---
title: 'Story 3.3 — Converser avec l''Assistant dans le Chat'
type: feature
created: '2026-08-29'
status: 'draft'
review_loop_iteration: 0
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/epic-3-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le panneau Chat est un placeholder statique — Gedeonkp ne peut pas dialoguer avec l'Assistant IA pendant l'édition d'un diagramme. Le backend (Tauri commands, personas, OpenRouter client) est 100% opérationnel mais l'UI frontend n'expose aucune fonctionnalité de conversation.

**Approach:** Réécrire `ChatSidebar` en un panneau conversationnel complet : zone de messages scrollable avec bulles user/assistant, champ de saisie avec envoi, indicateur "IA en cours", et intégration avec `sendChatMessage()` existant. `WorkshopLayout` gère l'état conversationnel et transmet les props nécessaires (projectPath, diagramPath, contenu diagramme).

## Boundaries & Constraints

**Always:**
- Tous les appels IA passent par `sendChatMessage()` → `invoke("send_chat_message")` — jamais de `fetch` direct vers OpenRouter (AD-1).
- L'historique de session est maintenu en state React (pas de persistence disque — c'est un thread de session uniquement).
- Le contenu du diagramme courant (`diagramContent`) est envoyé avec chaque message pour que l'IA puisse lire le contexte.
- Si `diagram_reset: true` dans la réponse, recharger le canvas via `loadDiagramIntoCanvas()`.
- Si `diagram_update` est présent, le JSON Excalidraw est validé et appliqué au canvas (Story 3.4 handles this — ici on stocke le résultat, l'application sera câblée dans 3.4).
- Microcopy en français, ton calme et direct (NFR-8).
- Excalifont utilisée partout dans le chat (UX-DR2).
- Bulles user : fond noir, texte beige en thème clair (DESIGN.md).
- Indicateur "IA en cours" visible pendant l'attente de réponse (UX-DR7).
- Chat ne masque pas le canvas — sidebar 320px fixe, repliable (UX-DR13).

**Ask First:**
- Aucun.

**Never:**
- Appeler OpenRouter directement depuis le WebView.
- Persister l'historique chat dans `.fun/` — c'est un thread éphémère de session.
- Afficher la stack trace brute en cas d'erreur — messages explicites en français.
- Envoyer un message vide (input vide → bouton désactivé).

</frozen-after-approval>

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Envoi message avec clé configurée | `aiStatus.key_configured = true`, message non vide | Réponse assistant affichée dans le thread, persona badge visible | Erreur réseau → message d'erreur français dans le chat |
| Envoi message sans clé | `aiStatus.key_configured = false` | Input désactivé ou hint "Définissez OPENROUTER_API_KEY" | Pas d'appel backend |
| Réponse IA avec diagram_update | `diagram_update: non-null` | Stocké pour application (Story 3.4) — badge "Modification IA" affiché | JSON invalide → ignorer, afficher warning |
| Réponse IA avec diagram_reset | `diagram_reset: true` | Canvas rechargé avec document vide via `loadDiagramIntoCanvas()` | Erreur rechargement → message d'erreur dans chat |
| Attente réponse IA | Requête en cours | Indicateur "IA en cours" animé visible | Timeout 120s → erreur affichée |
| Input vide | Chaîne vide | Bouton envoyer désactivé | N/A |
| Scroll automatique | Nouveau message ajouté | Scroll auto vers le bas sauf si l'utilisateur a scrollé manuellement | N/A |
| Session sans diagramme ouvert | `activeDiagramPath = null` | Chat fonctionne sans contexte diagramme — `diagramContent` null | N/A |

## Code Map

- `src/components/workshop/ChatSidebar.tsx` — **Réécriture complète** : panneau conversationnel avec input, messages, loading. Reçoit projectPath, diagramPath, history, callbacks.
- `src/components/workshop/WorkshopLayout.tsx` — **Modification** : ajouter state `chatHistory`, `chatLoading`, `chatError`. Passer projectPath, activeDiagramPath, et callbacks à ChatSidebar.
- `src/lib/ai.ts` — Inchangé — `sendChatMessage()` déjà complet (ligne 32). Types `ChatTurn`, `SendChatResult` déjà définis.
- `src/lib/diagram.ts` — `loadDiagramIntoCanvas()` (ligne existante) réutilisé pour recharger après reset.
- `src/app/globals.css` — **Ajout** styles : `.workshop-chat__messages`, `.workshop-chat__message`, `.workshop-chat__input-area`, `.workshop-chat__typing`, `.workshop-chat__persona`.
- `src-tauri/src/ai/chat.rs` — Inchangé — backend complet.
- `src-tauri/src/ai/personas.rs` — Inchangé — personas Claire/Trace/Assistant.

## Tasks & Acceptance

**Execution:**
- [ ] `src/components/workshop/ChatSidebar.tsx` -- Réécrire en panneau conversationnel : textarea + bouton envoyer en bas, zone messages scrollable au milieu, indicateur "IA en cours", gérer envoi via `sendChatMessage()`
- [ ] `src/components/workshop/WorkshopLayout.tsx` -- Ajouter state `chatHistory: ChatTurn[]`, `chatLoading: boolean`. Créer `handleSendMessage` qui appelle `sendChatMessage()`, gère `diagram_reset` (reload canvas), stocke `diagram_update`. Passer `projectPath`, `activeDiagramPath`, `diagramContent`, `history`, callbacks à ChatSidebar
- [ ] `src/app/globals.css` -- Ajouter styles pour messages (user/assistant), input area, indicateur typing, persona badge, scroll container

**Acceptance Criteria:**
- Given un projet ouvert avec clé OpenRouter configurée, when Gedeonkp tape un message et clique envoyer, then le message user apparaît dans le chat et la réponse assistant s'affiche avec son nom de persona.
- Given une réponse IA en cours, when le backend traite, then un indicateur "IA en cours" est visible dans le panneau chat.
- Given une réponse avec `diagram_reset: true`, when la réponse arrive, then le canvas est rechargé avec un diagramme vide.
- Given un message envoyé sans diagramme ouvert, when la réponse arrive, then elle s'affiche normalement sans erreur.
- Given l'input vide, when Gedeonkp regarde le chat, then le bouton envoyer est désactivé.
- Given une erreur réseau ou API, when l'envoi échoue, then un message d'erreur français s'affiche dans le chat sans crash.
- Given plusieurs messages échangés, when le scroll dépasse la zone visible, then le scroll automatique va vers le bas (sauf si l'utilisateur a scrollé manuellement).

## Verification

**Commands:**
- `npm run build` -- vérifier compilation TypeScript sans erreur
- `cargo build` -- vérifier que le backend compile (inchangé mais sanity check)

**Manual checks:**
- Ouvrir un projet → vérifier que le chat affiche l'input et le statut IA
- Envoyer "Bonjour" → vérifier que la réponse s'affiche avec le badge persona
- Envoyer une demande de modification (ex. "ajoute un rectangle") → vérifier que `diagram_update` est retourné
- Demander "repartir de zéro" → vérifier le rechargement du canvas
- Vérifier l'indicateur "IA en cours" pendant l'attente
- Vérifier le scroll automatique avec plusieurs messages
- Vérifier que le bouton est désactivé quand l'input est vide
