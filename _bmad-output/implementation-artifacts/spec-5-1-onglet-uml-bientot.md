---
title: 'Story 5.1 — Onglet UML (ou « Bientôt »)'
type: feature
created: '2026-08-29'
status: done
baseline_commit: NO_VCS
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/briefs/brief-Fun-2026-08-27/brief.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'atelier Fun est orienté Sketch (Excalidraw) — il n'y a pas de place pour un diagramme UML structuré et l'utilisateur ne peut pas basculer vers un mode UML distinct.

**Approach:** Ajouter un mode rail (Sketch / UML) dans l'atelier. En mode UML, le canvas affiche un placeholder « Bientôt » — pas de draw.io intégré au MVP. Le mode est purely cosmétique pour l'instant : il change le label du rail et le titre du canvas, mais le canvas Sketch reste opérationnel. Cela prépare l'intégration future de draw.io sans bloquer la release MVP.

## Boundaries & Constraints

**Always:**
- Mode UML = placeholder « Bientôt » au MVP (FR-8, UX-DR11) — pas de draw.io intégré.
- Le toggle Sketch/UML est dans le rail (48px) ou la toolbar.
- Le mode n'altère pas le fonctionnement du canvas Sketch — l'utilisateur peut toujours dessiner.
- Microcopy française : « Bientôt » en mode UML, « Sketch » en mode Sketch.
- Persistance du mode préféré optionnelle (à décider : store settings).

**Ask First:**
- Aucun.

**Never:**
- Importer ou intégrer draw.io au MVP — c'est deferred.
- Désactiver le canvas Sketch en mode UML — il reste accessible.

## I/O & Edge-Case Matrix

|| Scenario | Input / State | Expected Output / Behavior | Error Handling |
||----------|--------------|---------------------------|----------------|
|| Basculer vers UML | Clic toggle UML | Rail affiche « UML », canvas affiche « Bientôt » en overlay | N/A |
|| Basculer vers Sketch | Clic toggle Sketch | Rail affiche « Sketch », canvas retour à l'éditeur normal | N/A |
|| Mode UML avec diagramme ouvert | Diagramme chargé en mode UML | Canvas affiche le diagramme + overlay « Bientôt » | À décider : le diagramme reste visible ou masqué ? Oui, visible. |
|| Persistance préférence | Changement de mode | Optionnel : persister dans settings.json | Pas requis MVP |

</frozen-after-approval>

## Code Map

- `src/components/workshop/WorkshopLayout.tsx` — **update** : gestion du mode `sketch` / `uml`, rendu conditionnel du rail et du titre.
- `src/components/workshop/CanvasArea.tsx` — **update** : afficher le placeholder « Bientôt » quand `mode === 'uml'`.
- `src/components/workshop/Rail.tsx` — **new/update** : affichage du mode courant, bouton toggle Sketch/UML.
- `src/components/workshop/Toolbar.tsx` — **update** : éventuellement ajouter le toggle dans la toolbar.
- `src/lib/settings.ts` — pas de changement requis pour le MVP (mode non persisté).

## Tasks & Acceptance

**Execution:**
- [ ] `src/components/workshop/Rail.tsx` — afficher le mode courant, bouton toggle Sketch/UML.
- [ ] `src/components/workshop/WorkshopLayout.tsx` — état `mode: 'sketch' | 'uml'`, toggle depuis le rail.
- [ ] `src/components/workshop/CanvasArea.tsx` — quand `mode === 'uml'`, afficher un overlay « Bientôt » sur le canvas (pas de draw.io).
- [ ] Microcopy : « Sketch » et « UML » dans le rail, « Bientôt » dans le canvas UML.
- [ ] Vérifier que le toggle ne régit pas la navigation — l'URL reste `/workshop?path=`.

**Acceptance Criteria:**
- Given l'atelier ouvert en mode Sketch, when l'utilisateur bascule vers UML, then le rail affiche « UML » et le canvas affiche un placeholder « Bientôt ».
- Given le mode UML actif, when l'utilisateur bascule vers Sketch, then le rail revient à « Sketch » et le canvas est normal.
- Given un diagramme ouvert en mode UML, when le mode est actif, then le diagramme reste visible (overlay « Bientôt » en superposition).

## Spec Change Log

## Verification

**Commands:**
- `npm run lint` — expected: exit 0
- `npm run build` — expected: exit 0

**Manual checks:**
- `npm run tauri dev` : ouvrir un projet, basculer vers UML, vérifier que le rail et le canvas affichent « Bientôt ».
- Basculer vers Sketch — retour à l'éditeur normal.
- Ouvrir un diagramme puis basculer vers UML — le diagramme reste visible avec l'overlay.

## Suggested Review Order

**Rail mode toggle**
- Point d'entrée : affichage du mode, bouton toggle.
  [`Rail.tsx`](../../src/components/workshop/Rail.tsx)

**Canvas placeholder**
- `CanvasArea.tsx` : overlay « Bientôt » en mode UML.
  [`CanvasArea.tsx`](../../src/components/workshop/CanvasArea.tsx)

**Orchestration layout**
- `WorkshopLayout.tsx` : état mode, rendu conditionnel.
  [`WorkshopLayout.tsx`](../../src/components/workshop/WorkshopLayout.tsx)
