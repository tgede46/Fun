---
name: bmad-agent-builder
description: |
  Build an AI agent skill using BMad methodology.
  Use when the user wants to create, edit, or rebuild an agent skill through conversational discovery.
  Handles "Create an Agent", "Analyze an Agent", or "Edit an Agent" requests.
---

# BMad Agent Builder

## Overview

Ce skill guide la création d'un agent AI selon la méthodologie BMad. Il prend en charge trois modes :

- **Créer un agent** — construire un nouvel agent à partir de zéro
- **Analyser un agent** — évaluer la qualité et la cohérence d'un agent existant
- **Modifier un agent** — améliorer ou corriger un agent existant

## Structure d'un agent BMad

Un agent BMad se compose de :

```
skills/<agent-name>/
├── SKILL.md          # Définition principale de l'agent
├── references/       # Documentation de référence
├── assets/           # Templates, exemples, ressources
└── scripts/          # Scripts utilitaires (optionnel)
```

### SKILL.md — champs principaux

```yaml
---
name: <agent-name>
description: |
  Description de l'agent et de son rôle.
  Inclut les conditions de déclenchement (when to use).
---

# <Agent Name>

## Overview
[Description générale]

## When to use
- [Scénario 1]
- [Scénario 2]

## Identity
[Rôle et personnalité de l'agent]

## Capabilities
| Capability | Description |
|------------|-------------|
| [Capacité 1] | [Description] |
| [Capacité 2] | [Description] |

## Principles
- [Principe 1]
- [Principe 2]

## Communication Style
[Tone, language, format preferences]

## References
- [Référence 1]
- [Référence 2]
```

## Modes d'utilisation

### Mode Créer

1. **Clarifier le but** — Quel problème l'agent résout-il ?
2. **Définir l'identité** — Nom, rôle, personnalité, expertise
3. **Spécifier les capacités** — Que peut faire l'agent ?
4. **Établir les principes** — Règles de comportement, contraintes
5. **Définir le style de communication** — Tone, langue, format
6. **Documenter les références** — Ressources, connaissances spécialisées

### Mode Analyser

1. **Examiner la structure** — Vérifier la complétude des champs
2. **Évaluer la cohérence** — Identité, capacités, et principes alignés ?
3. **Tester les déclenchements** — Les conditions d'utilisation sont-elles claires ?
4. **Identifier les gaps** — Ce qui manque ou est ambigu
5. **Proposer des améliorations** — Recommandations concrètes

### Mode Modifier

1. **Identifier le problème** — Quoi améliorer ou corriger
2. **Proposer les changements** — Modifications spécifiques
3. **Appliquer les modifications** — Mettre à jour SKILL.md et fichiers associés
4. **Valider** — Vérifier que les changements sont cohérents

## Bonnes pratiques

- **Spécificité** — Les capacités doivent être concrètes et testables
- **Cohérence** — L'identité doit correspondre aux capacités et au style
- **Clarté** — Les déclenchements doivent être unambiguous
- **Évolutivité** — Prévoir des références et assets pour l'avenir

## Exemples

Voir `assets/` pour des templates et exemples d'agents.

---

*Made with BMad methodology*
