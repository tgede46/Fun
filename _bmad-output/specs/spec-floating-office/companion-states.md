# États compagnon 💬

| État | Visuel | Déclencheur |
|------|--------|-------------|
| `idle` | 💬 statique | Par défaut, pas de requête en cours |
| `thinking` | 💬 pulse / spinner discret | `send_chat_message` en cours après fermeture overlay |
| `done` | 💬 + badge | Réponse reçue, overlay fermé — jusqu'à ouverture ou lecture |
| `error` | 💬 + indicateur erreur | Échec invoke — badge + message dans overlay à la réouverture |

Fermer l'overlay **n'annule pas** la requête. `chatLoading` reste true côté layout jusqu'à résolution.

## États compagnon 🍅 (Souffle)

| Phase | Audio | Scène visuelle |
|-------|-------|----------------|
| Idle | off | off |
| Work running | lofi ON (volume settings) | scène travail ON (1 ambiance MVP) |
| Break | adouci ou off | overlay méditation existant ou variante légère |
| Stopped | off | off |

Mute depuis le panneau 🍅 : coupe audio sans arrêter le timer.
