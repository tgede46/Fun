---
title: 'Canvas hybride 2D/3D — Sketch + UML + Modélisation 3D'
type: feature
created: '2026-08-31'
status: 'done'
baseline_commit: '705a14d'
review_loop_iteration: 0
context:
  - _bmad-output/planning-artifacts/architecture/architecture-Fun-2026-08-29/ARCHITECTURE-SPINE.md
  - src/canvas/types.ts
  - src/components/workshop/CanvasArea.tsx
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'atelier Fun dispose de deux modes séparés (Sketch SVG custom et UML placeholder) sans capacité 3D. L'utilisateur veut un seul canvas hybride combinant Excalidraw (2D libre), draw.io (2D structuré) et modélisation 3D complète (Three.js).

**Approach:** Créer un canvas unifié avec switch entre modes 2D (Excalidraw + draw.io) et 3D (Three.js/react-three-fiber). Le mode 2D garde le canvas SVG existant + Excalidraw embed. Le mode 3D ajoute une vue 3D avec orbite, transformations, éclairage et textures. Shared state entre les vues pour synchroniser les objets 2D↔3D.

## Boundaries & Constraints

**Always:**
- Canvas SVG existant (FunCanvas) reste le moteur 2D principal
- Excalidraw embed accessible en mode "sketch" pour dessin libre
- draw.io accessible en mode "uml" pour diagrammes structurés
- Three.js (react-three-fiber) pour la vue 3D
- Synchronisation bidirectionnelle 2D↔3D (un rect 2D = un mesh 3D)
- Persistance `.fun/diagrams/` avec format étendu pour objets 3D
- Performance : 60fps en mode 3D avec <100 objets

**Ask First:**
- Format de fichier unifié (extension .fun ? ou garder .excalidraw avec champs 3D ?)
- Niveau de détail 3D (meshes simples vs CSG vs import GLTF)
- UI de switch entre modes (onglets vs toggle vs dropdown)

**Never:**
- Supprimer le canvas SVG existant (FunCanvas)
- Casser la compatibilité avec les .excalidraw existants
- Utiliser un moteur 3D autre que Three.js

</frozen-after-approval>

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Switch 2D→3D | Mode 3D sélectionné | Canvas SVG masqué, Three.js Canvas affiché, objets convertis en meshes | Fallback 2D si WebGL indisponible |
| Switch 3D→2D | Mode 2D sélectionné | Three.js Canvas masqué, Canvas SVG affiché, meshes convertis en objets 2D | N/A |
| Objet 2D créé | Rectangle dessiné en 2D | Mesh 3D correspondant apparaît en mode 3D | N/A |
| Objet 3D créé | Mesh ajouté en 3D | Objet 2D correspondant apparaît en mode 2D | N/A |
| Caméra 3D | Orbit/zoom/pan | Vue 3D navigable | Limiter zoom min/max |
| Sauvegarde | Diagramme modifié | JSON étendu avec champs 3D (position, rotation, scale, material) | Fallback format legacy |
| Load legacy | Fichier .excalidraw existant | Chargé en mode 2D, objets 3D générés automatiquement | N/A |

## Code Map

- `src/canvas/types.ts` -- Types FunObject étendus avec Mesh3D, Light3D, Camera3D
- `src/canvas3d/` -- Nouveau dossier : Canvas3D.tsx, renderers/, tools/, hooks/
- `src/canvas3d/Canvas3D.tsx` -- Composant Three.js principal (react-three-fiber)
- `src/canvas3d/renderers/MeshRenderer.tsx` -- Rendu des meshes 3D (box, sphere, cylinder, custom)
- `src/canvas3d/tools/OrbitTool.tsx` -- Navigation caméra 3D (orbit, pan, zoom)
- `src/canvas3d/tools/TransformTool.tsx` -- Transformations 3D (translate, rotate, scale)
- `src/canvas3d/hooks/useScene3D.ts` -- Hook gestion scène 3D (sync avec 2D)
- `src/canvas3d/utils/conversion.ts` -- Conversion 2D↔3D (objets ↔ meshes)
- `src/components/workshop/CanvasArea.tsx` -- Update : switch 2D/3D avec bouton toggle
- `src/components/workshop/ModeRail.tsx` -- Update : ajout mode "3d"
- `src/components/workshop/Toolbar.tsx` -- Update : bouton basculer 2D↔3D
- `src/lib/diagram.ts` -- Update : sérialisation format étendu avec données 3D

## Tasks & Acceptance

**Execution:**
- [x] `src/canvas/types.ts` -- Ajouter types Mesh3D, Light3D, Camera3D, Material3D
- [x] `src/canvas3d/` -- Créer structure dossier avec renderers/, tools/, hooks/, utils/
- [x] `src/canvas3d/Canvas3D.tsx` -- Composant Three.js avec lighting, grid, controls
- [x] `src/canvas3d/renderers/MeshRenderer.tsx` -- Rendu box/sphere/cylinder/extrude
- [x] `src/canvas3d/tools/TransformTool.tsx` -- TransformControls (G/R/S)
- [x] `src/canvas3d/hooks/useScene3D.ts` -- Sync scène 3D avec scene 2D
- [x] `src/canvas3d/utils/conversion.ts` -- FunObject→Mesh3D et Mesh3D→FunObject
- [x] `src/components/workshop/CanvasArea.tsx` -- Toggle 2D/3D, conditional render
- [x] `src/components/workshop/ModeRail.tsx` -- Ajouter icône mode 3D
- [x] `src/lib/diagram.ts` -- Étendre sérialisation avec champs 3D optionnels
- [x] `package.json` -- Ajouter three, @react-three/fiber, @react-three/drei

**Acceptance Criteria:**
- Given atelier ouvert, when je clique toggle 3D, then vue Three.js s'affiche avec les objets du diagramme
- Given mode 3D, when j'ajoute un mesh, then il apparaît en 2D quand je reviens en mode 2D
- Given mode 2D, when je dessine un rectangle, then un box 3D correspondant apparaît en mode 3D
- Given fichier .excalidraw legacy, when je l'ouvre, then il charge en 2D sans erreur
- Given mode 3D, when j'orbit/zoom, then la caméra répond à 60fps

## Spec Change Log

## Design Notes

Le pattern est similaire à Tldraw : un canvas 2D SVG principal avec une vue 3D alternative. La synchronisation utilise un format unifié interne (FunScene étendu) qui contient à la fois les objets 2D et les métadonnées 3D. La conversion est bidirectionnelle et basée sur des règles (rect→box, ellipse→sphere, etc.).

## Verification

**Commands:**
- `npm run build` -- expected: exit 0, pas d'erreur SSR Three.js
- `npm run lint` -- expected: aucune erreur ESLint
- `cargo test --manifest-path src-tauri/Cargo.toml` -- expected: tests existants passent

**Manual checks:**
- `npm run tauri dev` : ouvrir projet → dessiner 2D → switch 3D → objets visibles → orbit → switch 2D → objets intacts
- Vérifier performance : >100 objets, 60fps en mode 3D
- Vérifier load fichier .excalidraw existant → pas de régression