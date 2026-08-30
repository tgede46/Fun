---
title: 'Story 2.5 — Thème sombre électrique (test workflow)'
type: feature
created: '2026-08-30'
status: 'in-progress'
baseline_commit: NO_VCS
spec_slug: 2-5-electro-dark-theme
---

<frozen-after-approval reason="human-owned intent">

## Intent

**Problem:** L'application Fun utilise Segoe UI partout. Le thème sombre actuel est juste un invert gris, pas assez contrasté pour les heures tardives.

**Approach:** Introduire un thème "électro" sombre avec couleurs plus vives (#0a0a1a background, #00d4ff accents cyan), toggle dans la barre latérale, persistance dans `.fun/settings.json`.

## Boundaries & Constraints

**Always:**
- Respecter les tokens de design existants dans `globals.css`
- Préserver la palette claire actuelle comme thème par défaut
- Persister le choix dans `.fun/settings.json`

**Never:**
- Modifier les autres featurse du workshop
- Utiliser des couleurs qui réduisent le contraste AA

</frozen-after-approval>

## Code Map

- `app/globals.css` — nouveaux tokens CSS pour thème électro
- `components/ThemeToggle.tsx` — nouveau composant toggle
- `app/sidebar.tsx` — intégration du toggle
- `lib/settings.ts` — lecture/écriture `.fun/settings.json`
