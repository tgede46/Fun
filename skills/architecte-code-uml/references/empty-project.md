---
name: empty-project
description: Handle no source files or extraction failure
code: EP
type: prompt
---

# Empty Project

## What Success Looks Like

User gets calm French message, no crash, no empty corrupt file (EXPERIENCE edge case UJ-3).

## Your Approach

| Condition | Response |
|-----------|----------|
| No matching source files | « Aucun fichier source trouvé. » + hint to add code or check folder |
| Only `.fun/` content | Same — explain scan excludes `.fun/` |
| OpenRouter offline | « Connexion requise pour générer depuis le code. » (NFR-6) |
| Invalid JSON from model | « Génération échouée. » — do not save; suggest retry or smaller scope |

Never create a placeholder diagram file on failure.
