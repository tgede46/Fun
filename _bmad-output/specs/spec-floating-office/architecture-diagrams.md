# Architecture — Floating Office

## Composants cibles

```mermaid
flowchart TB
  subgraph WorkshopLayout
    Canvas[CanvasArea + Excalidraw]
    FC[FloatingCompanionHost]
  end

  subgraph FC
    BubbleChat["💬 BubbleChat"]
    BubblePomo["🍅 BubbleSouffle"]
    OverlayChat[ChatOverlay]
    OverlayScene[LofiSceneOverlay]
  end

  BubbleChat -->|click| OverlayChat
  OverlayChat --> ChatSidebar[ChatSidebar réutilisé]
  ChatSidebar --> TauriChat[send_chat_message]
  TauriChat -->|done| NotifyOS[Notification Tauri]
  TauriChat -->|diagram_update| Canvas

  BubblePomo --> SouffleHook[usePomodoro]
  SouffleHook -->|work start| LofiAudio[HTMLAudioElement]
  SouffleHook -->|work start| OverlayScene
  SouffleHook -->|phase end| NotifyOS

  FC --> Settings[.fun/settings.json]
```

## Flux async chat

```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant UI as 💬 Overlay
  participant B as Bubble
  participant T as Tauri chat
  participant N as Notif OS

  U->>UI: Envoie message
  UI->>T: send_chat_message
  U->>UI: Ferme overlay
  B->>B: état thinking pulse
  T-->>T: traitement async
  T->>N: notify chat complete
  B->>B: état done + badge
  U->>UI: Rouvre overlay
  UI->>U: Réponse + canvas MAJ
```

## Persistance

Positions et préférences compagnons dans `.fun/settings.json` — étendre le schéma Rust `ProjectSettings` et le type TS `ProjectSettings`.
