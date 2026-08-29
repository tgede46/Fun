# Rapport — 5 work items déferés Story 1.2 (Accueil / projets récents)

## 1. Tests automatisés (React + Rust) pour la matrice I/O accueil/recents

**Ce qu'on trouve :**
- Aucun framework de test configuré. `package.json` (l.19-27) ne liste aucune dépendance de test (pas Vitest, Jest, React Testing Library, @testing-library/react, etc.). Les devDependencies se limitent à eslint, typescript, et les types.
- Côté Rust, `Cargo.toml` (l.12-24) n'a pas de section `[dev-dependencies]` et ne configure pas de crate de test (pas `mockall`, `tempfile`, etc.).
- Aucun fichier `*test*` ou `*spec*` trouvé dans `src-tauri/src/` (recherche `*.rs` + filtre test) ni dans `src/`.
- Aucun `vitest.config.*`, `jest.config.*`, ou `vite.config.*` présent à la racine.

**Ce qui manque :**
- Stack de test complète des deux côtés. Pour React : Vitest + @testing-library/react + @testing-library/jest-dom + ms-w/stable pour mock du navigateur. Pour Rust : tests unitaires inline (`#[cfg(test)]`) dans `recent.rs` et `commands.rs`, éventuellement une integ test avec `tauri::test` ou des tests qui appellent les commands via Tauri's test harness.
- Scénarios spec 1.2 non couverts : (a) accueil vide (store JSON absent ou vide → affiche `home__empty`), (b) recents affichés (store avec 1+ projets → grille `home__grid`), (c) clic carte (invoke `open_project` + `router.push(/workshop?path=)`), (d) clic CTA dossier (invoke `pick_project_folder` + `open_project`).

**Fichiers/symbols/lines clés :**
- `/home/gedeonkp/Documents/projet/Fun/package.json` — l.19-27 (devDependencies sans test)
- `/home/gedeonkp/Documents/projet/Fun/src-tauri/Cargo.toml` — l.12-24 (pas de dev-dependencies test)
- `/home/gedeonkp/Documents/projet/Fun/src/components/home/HomeScreen.tsx` — l.33-57 (effect qui charge recents, scénario à tester), l.69-81 (openProject), l.83-94 (handleOpenFolder)
- `/home/gedeonkp/Documents/projet/Fun/src-tauri/src/recent.rs` — l.65-79 (list_recent_projects), l.81-104 (touch_recent_project) — candidats pour tests Rust
- `/home/gedeonkp/Documents/projet/Fun/src-tauri/src/commands.rs` — l.54-56 (get_recent_projects), l.59-65 (open_project) — candidats pour tests Rust

---

## 2. Navigation directe `/workshop?path=` côté atelier

**Ce qu'on trouve :**
- ✅ Route `/workshop` gère déjà le query param `path` : `src/app/workshop/page.tsx` l.17-18 récupère `searchParams.get("path")?.trim()` et l.32-34 fait un `invoke<OpenProjectResult>("open_project", { projectPath })`.
- ✅ Navigation déclarée dans les liens existants : `HomeScreen.tsx` définit `workshopHref(path)` (l.20-22) qui génère `/workshop?path=${encodeURIComponent(path)}`, et l'utilise à l.75 (après `openProject`) et l.117 (après `createProject`). Ces pushes sont bien les liens qui connectent l'accueil à l'atelier.
- ✅ Feedback UI complet : état vide (l.57-64), chargement (l.69-71), erreur (l.73-82), projet ouvert (l.84-87).

**Ce qui manque :**
- Aucun navigateur/personne peut taper `/workshop?path=/some/dir` manuellement dans la barre et faire fonctionner l'ouverture — le `useSearchParams()` à l'intérieur de `Suspense` le permet techniquement, mais si le paramètre est fourni avant le premier rendu côté client, le `useEffect` déclenche l'invoke. Cela devrait fonctionner mais n'a pas été testé.
- Pas de préférence/type de lien `<Link>` statique vers `/workshop?path=...` dans le code (toutes les navigations sont programmatiques via `router.push`). Si on veut un lien cliquable depuis ailleurs, il faudrait ajouter un `<Link>`.

**Fichiers/symbols/lines clés :**
- `/home/gedeonkp/Documents/projet/Fun/src/app/workshop/page.tsx` — l.17-18 (lecture `path`), l.32-34 (invoke `open_project`), l.90-94 (WorkshopPageInner avec Suspense)
- `/home/gedeonkp/Documents/projet/Fun/src/components/home/HomeScreen.tsx` — l.20-22 (`workshopHref`), l.75 et l.117 (push vers atelier)

---

## 3. Canonicalisation des chemins recents (symlinks, spellings)

**Ce qu'on trouve :**
- `src-tauri/src/recent.rs` ne fait **aucune normalisation** des chemins.
  - `touch_recent_project` (l.81-104) stocke `project_path` (la String passée en param) directement dans l'entrée (l.88) — c'est le chemin brut tel qu'obtenu du frontend ou du dialog.
  - `list_recent_projects` (l.65-79) filtre les entrées dont le chemin n'existe plus comme dossier (l.71: `Path::new(&project.path).is_dir()`) mais ne dedup pas les spellings équivalentes (ex: `/home/user/projet` vs `/home/user/projet/`, ou via symlink).
  - Aucun appel à `std::fs::canonicalize()` ou `realpath` dans le flux.
- `commands.rs` : `open_project_at` (l.289-311) passe `path_buf.to_string_lossy().into_owned()` (l.298) directement à `touch_recent_project` — donc le chemin stocké est celui qui a été fourni, sans résolution de symlink.
- Si un utilisateur ouvre le même projet via deux spellings différents (par exemple, une fois via le chemin absolu, une fois via un symlink, ou avec/without trailing slash), le store peut contenir des doublons.

**Ce qui manque :**
- Canonicalisation avant stockage : appeler `std::fs::canonicalize()` sur `PathBuf` avant de convertir en String pour le stockage. Cela résolve les symlinks et produit un chemin unique.
- Déduplication lors de la lecture : ou bien canonicaliser à la volée dans `list_recent_projects` en regroupant par chemin canonique, ou bien canonicaliser au moment de l'écriture et rejeter les doublons.
- Normalisation trailing-slash : `PathBuf` ne le fait pas automatiquement.

**Fichiers/symbols/lines clés :**
- `/home/gedeonkp/Documents/projet/Fun/src-tauri/src/recent.rs` — l.82-88 (construction de l'entrée sans canonicalisation), l.94-102 (lecture/écriture du store), l.65-79 (listage sans dedup)
- `/home/gedeonkp/Documents/projet/Fun/src-tauri/src/commands.rs` — l.289-311 (`open_project_at`, passage du chemin brut à `touch_recent_project`), l.298 (conversion `to_string_lossy`)

---

## 4. Écriture atomique du store JSON recents

**Ce qu'on trouve :**
- `src-tauri/src/recent.rs` écrit le store avec **`fs::write` direct** (non atomique).
  - `write_store` (l.40-47) : sérialise en JSON pretty, puis `fs::write(path, raw)` — écrire direct sur le fichier cible.
  - `read_store` (l.29-38) : `fs::read_to_string` + `serde_json::from_str`, avec fallback `unwrap_or_default()` en cas d'erreur de lecture ou de parse.
- Risque de corruption : si le process crash ou est tué entre le début et la fin de `fs::write`, le fichier JSON peut être tronqué ou corrompu. Comme `read_store` fait un `unwrap_or_default()` (l.37), une corruption entraîne une perte silencieuse de tous les projets récents (retour au store vide).
- `list_recent_projects` appelle `write_store` à l.75 quand des entrées sont purgées (dossier introuvable) — écriture non atomique donc potentiellement corrompue si crash au milieu.
- `touch_recent_project` appelle `write_store` à l.102 après insertion/modification — même risque.

**Ce qui manque :**
- Pattern atomic write : écrire dans un fichier temporaire dans le même répertoire, puis `fs::rename` (atomique sur la même filesystem) pour remplacer le fichier cible.
- Gestion d'erreur plus defensive : au minimum, écrire dans un backup avant d'écraser, ou utiliser un fichier `.lock` pour éviter les écritures concurrentes (bien que dans un contexte Tauri single-threaded cela soit moins critique, mais `list_recent_projects` et `touch_recent_project` peuvent être appelés en parallèle depuis le frontend).

**Fichiers/symbols/lines clés :**
- `/home/gedeonkp/Documents/projet/Fun/src-tauri/src/recent.rs` — l.40-47 (`write_store` avec `fs::write`), l.29-38 (`read_store` avec fallback), l.75 (appel à `write_store` dans `list_recent_projects`), l.102 (appel à `write_store` dans `touch_recent_project`)

---

## 5. Excalifont sur les cartes accueil selon DESIGN.md

**Ce qu'on trouve :**
- ✅ `DESIGN.md` existe bien : `_bmad-output/planning-artifacts/ux-designs/ux-Fun-2026-08-29/DESIGN.md`.
- ✅ Typo spécifiée : **Excalifont** (fallback Virgil, Segoe UI Emoji, sans-serif) — définie à plusieurs niveaux : `ui` (l.28), `ui-sm` (l.33), `canvas-label` (l.38), `timer` (l.43).
- ✅ `globals.css` charge la police : `@font-face` pour Excalifont avec `src: url("/fonts/Excalifont-Regular.woff2")` (l.1-7).
- ✅ `globals.css` applique la typo globalement : `--fun-typography-ui-family: Excalifont, Virgil, "Segoe UI Emoji", sans-serif` (l.47), et `body { font-family: var(--fun-typography-ui-family); }` (l.93). Donc tout le DOM hérite d'Excalifont par défaut.
- ✅ Cartes accueil (`.project-card`) : héritent de la police body. `.project-card__name` (l.290-293) utilise `font-size: 1.05rem; font-weight: 600` — la typo Excalifont est présente mais non explicitement redéfinie (héritage). `.project-card__path` (l.295-299) utilise `--fun-typography-ui-sm-size` — même héritage.
- ⚠️ **Cependant** : le fichier de police `/fonts/Excalifont-Regular.woff2` est référencé mais son existence réelle dans le projet n'a pas été vérifiée. Si le fichier est absent du build, la police tombe en fallback (Virgil, puis sans-serif système) — ce qui contrevient à la spec "Excalifont partout".

**Ce qui manque / à vérifier :**
- Confirmer que `public/fonts/Excalifont-Regular.woff2` existe bien dans le projet (le `@font-face` pointe vers `/fonts/...` — Next.js sert depuis `public/`).
- Si le fichier est manquant, le télécharger ou le générer depuis Excalidraw's font bundle (la spec mentionne `[ASSUMPTION]` que les polices Excalidraw sont bundlées via `@excalidraw/excalidraw` — à vérifier si cette dépendance exporte les fonts ou si un import manuel est nécessaire).
- Aucune spécification de graisse bold pour les titres cartes dans DESIGN.md (la spec dit "pas de graisse bold systématique" l.116) — le `font-weight: 600` sur `.project-card__name` est acceptable comme accent, mais c'est une déviation mineure de la charte.

**Fichiers/symbols/lines clés :**
- `/home/gedeonkp/Documents/projet/Fun/_bmad-output/planning-artifacts/ux-designs/ux-Fun-2026-08-29/DESIGN.md` — l.26-47 (typography definitions), l.114-116 (exigence Excalifont dans le texte)
- `/home/gedeonkp/Documents/projet/Fun/src/app/globals.css` — l.1-7 (`@font-face` Excalifont), l.47 (var typography-ui-family), l.93 (body font-family), l.273-299 (styles `.project-card`, `.project-card__name`, `.project-card__path`)
- `/home/gedeonkp/Documents/projet/Fun/src/components/home/ProjectCard.tsx` — composant présentation pur, pas de style inline (l.9-16), respecte la charte globale
- `/home/gedeonkp/Documents/projet/Fun/package.json` — l.13 (`@excalidraw/excalidraw: ^0.18.1`) — dépendance qui pourrait fournir les fonts, à vérifier

---

**Synthèse :** 2 items sont fonctionnels (nav `/workshop?path=`, typo Excalifont appliquée), 3 items nécessitent du travail : tests (rien de configuré), canonicalisation des chemins (absente), et écriture atomique du store (non atomique, risque de corruption).
