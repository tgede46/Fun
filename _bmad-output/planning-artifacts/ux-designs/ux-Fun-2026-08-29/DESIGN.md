---
name: Fun
description: Identité visuelle desktop — canvas sketch familier, chrome sobre beige et noir, typo Excalifont.
status: final
created: 2026-08-29
updated: 2026-08-29
colors:
  canvas-light: '#FFFFFF'
  canvas-dark: '#1E1E1E'
  surface-base-light: '#F5F0E8'
  surface-base-dark: '#0D0D0D'
  surface-raised-light: '#FFFFFF'
  surface-raised-dark: '#1A1A1A'
  foreground-light: '#1A1A1A'
  foreground-dark: '#F5F0E8'
  foreground-muted-light: '#5C5C5C'
  foreground-muted-dark: '#A8A096'
  accent-light: '#1A1A1A'
  accent-dark: '#F5F0E8'
  border-light: '#E0D8CC'
  border-dark: '#2E2E2E'
  overlay-scrim-light: 'rgba(26, 26, 26, 0.35)'
  overlay-scrim-dark: 'rgba(0, 0, 0, 0.55)'
  meditation-glow-light: '#F5F0E8'
  meditation-glow-dark: '#2A2824'
typography:
  ui:
    fontFamily: 'Excalifont, Virgil, Segoe UI Emoji, sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.45'
  ui-sm:
    fontFamily: 'Excalifont, Virgil, Segoe UI Emoji, sans-serif'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  canvas-label:
    fontFamily: 'Excalifont, Virgil, Segoe UI Emoji, sans-serif'
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.3'
  timer:
    fontFamily: 'Excalifont, Virgil, Segoe UI Emoji, sans-serif'
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  rail: 48px
  sidebar-chat: 320px
  toolbar: 48px
  gutter: 12px
components:
  button-primary:
    background: '{colors.accent-light}'
    foreground: '{colors.surface-base-light}'
    radius: '{rounded.md}'
  button-primary-dark:
    background: '{colors.accent-dark}'
    foreground: '{colors.surface-base-dark}'
    radius: '{rounded.md}'
  pomodoro-chip:
    background: '{colors.surface-raised-light}'
    foreground: '{colors.foreground-light}'
    border: '{colors.border-light}'
    radius: '{rounded.full}'
  chat-panel:
    background: '{colors.surface-raised-light}'
    border-left: '{colors.border-light}'
  canvas-toolbar:
    background: '{colors.surface-base-light}'
    border-bottom: '{colors.border-light}'
  mode-rail-icon-active:
    background: '{colors.foreground-light}'
    foreground: '{colors.surface-base-light}'
  meditation-modal:
    background: '{colors.meditation-glow-light}'
    foreground: '{colors.foreground-light}'
    radius: '{rounded.lg}'
    shadow: '0 8px 32px rgba(26,26,26,0.12)'
---

## Brand & Style

Fun est un **atelier desktop** : le canvas sketch reste le héros, le chrome UI reste discret. L’esthétique s’appuie sur la familiarité **Excalidraw** (toolbar, props latérales) avec une identité Fun : **beige et noir**, typo **Excalifont** partout — UI et labels canvas — pour une cohérence « dessin à la main » sans copier pixel par pixel.

Le thème **clair** privilégie fond **beige** et texte **noir** ; le thème **sombre** (soirées) inverse : fond **noir**, texte et accents **beige**. Pas de palette chromatique large — deux tons + canvas blanc ou gris très foncé.

Référence importée : `imports/excalidraw-reference.png`.

## Colors

**Thème clair**
- **Beige (`#F5F0E8`)** — fond app, toolbar, zones secondaires.
- **Noir (`#1A1A1A`)** — texte, icônes actives, boutons primaires, contours forts.
- **Blanc (`#FFFFFF`)** — canvas sketch et panneaux surélevés (chat, modale méditation).

**Thème sombre**
- **Noir (`#0D0D0D` / `#1A1A1A`)** — fond app et surfaces.
- **Beige (`#F5F0E8`)** — texte, timer, accents, icônes actives du rail gauche.
- **Gris canvas (`#1E1E1E`)** — surface de dessin (contraste suffisant avec traits clairs).

**Overlay pause** — scrim semi-transparent ; modale méditation en beige (clair) ou beige chaud assombri (sombre).

Éviter : couleurs saturées (bleu Excalidraw+, violet AI slop), dégradés décoratifs, plus de deux familles de couleur hors canvas.

## Typography

**Excalifont** (fallback Virgil, puis sans-serif système) pour toute l’UI : menus, chat, accueil projets, timer Pomodoro, modale méditation. Même voix que les labels sur le canvas — Fun ne « change pas de police » entre chrome et dessin.

Tailles : 16px corps, 14px secondaire, 20px titres canvas, 18px timer. Pas de graisse bold systématique ; la hiérarchie passe par la taille et le contraste beige/noir.

`[ASSUMPTION]` Polices Excalidraw bundlées ou self-hosted comme `@excalidraw/excalidraw` (voir doc embed fonts).

## Layout & Spacing

Desktop Tauri, fenêtre redimensionnable, **minimum ~1024×640**.

```
[ Toolbar — haut, pleine largeur ]
[ Rail 48px | Props? | Canvas (flex) | Chat 320px ]
              ↑ Pomodoro chip — coin haut-droit du canvas
```

- **Rail gauche (48px)** — icônes Sketch / UML ; panneau props Excalidraw en dessous quand sélection.
- **Chat (320px)** — sidebar droite, repliable `[ASSUMPTION]` pour maximiser canvas.
- **Accueil** — grille projets récents centrée, max-width ~720px.

## Elevation & Depth

Peu d’ombres. Surélévation légère pour : modale méditation, dropdown toolbar, toast notification Pomodoro. Bordures 1px `{colors.border-*}` plutôt que ombres lourdes.

## Shapes

Coins **modérément arrondis** (`md` 8px) sur panneaux et boutons ; **pill** (`full`) pour chip Pomodoro. Canvas : esthétique sketch Excalidraw (traits hand-drawn) — ne pas lisser les formes du moteur embed.

## Components

| Composant | Spec visuelle |
|---|---|
| Toolbar | Fond `{colors.surface-base-*}`, icônes noir/beige, hauteur `{spacing.toolbar}` |
| Mode rail | Icône active : fond inverse (noir sur clair / beige sur sombre) |
| Chat panel | Fond raised, bordure gauche, bulles utilisateur fond noir texte beige (clair) |
| Pomodoro chip | Pill compact, timer `{typography.timer}` |
| Meditation modal | Centrée, fond beige, texte Excalifont, overlay scrim sur canvas |
| Home cards | Projet récent : carte raised, titre Excalifont, bordure subtile |

## Do's and Don'ts

**Do**
- Toggle clair/sombre accessible depuis toolbar.
- Garder le canvas visuellement dominant (≥60% largeur hors chat).
- Utiliser Excalifont pour cohérence sketch + UI.

**Don't**
- Ajouter une troisième couleur d’accent sans décision explicite.
- Copier le branding Excalidraw+ (violet) ou logos tiers.
- Masquer le canvas derrière le chat par défaut.
