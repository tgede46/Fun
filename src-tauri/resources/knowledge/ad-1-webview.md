# AD-1 — Isolation WebView

Fun : Tauri (Rust) est le seul adaptateur plateforme. Next.js (WebView) n'utilise jamais `fs`, `path`, ni `fetch` vers OpenRouter.

Toute I/O disque, secrets, notifications OS et HTTP IA passe par des commandes/events Tauri typés.

Frontière : UI = présentation + état Excalidraw ; Platform = `.fun/`, OpenRouter, benchmark, notifs.
