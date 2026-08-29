import type { AiStatus } from "@/lib/ai";

type ChatSidebarProps = {
  aiStatus: AiStatus | null;
  aiError: string | null;
};

export function ChatSidebar({ aiStatus, aiError }: ChatSidebarProps) {
  return (
    <aside className="workshop-chat" aria-label="Chat">
      <p className="workshop-chat__label">Chat</p>
      {aiError ? (
        <p className="workshop-chat__error">{aiError}</p>
      ) : null}
      {aiStatus ? (
        <div className="workshop-chat__ai-status">
          <p className="workshop-chat__hint">
            {aiStatus.key_configured
              ? "Assistant IA — conversation bientôt disponible."
              : "Définissez OPENROUTER_API_KEY dans le fichier .env à la racine du projet."}
          </p>
          <p className="workshop-chat__model">
            Modèle actif : <span>{aiStatus.active_model}</span>
          </p>
          <p className="workshop-chat__model-source">
            {aiStatus.model_source === "benchmark"
              ? "Sélectionné par benchmark"
              : "Modèle par défaut (en attente du benchmark)"}
          </p>
        </div>
      ) : (
        <p className="workshop-chat__hint">Chargement du statut IA…</p>
      )}
    </aside>
  );
}
