import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { modelSourceLabel, shortModelName } from "@/lib/ai-labels";
import type { AiStatus, BenchmarkUiState, ChatTurn } from "@/lib/ai";

type ChatSidebarProps = {
  aiStatus: AiStatus | null;
  aiError: string | null;
  benchmarkState: BenchmarkUiState;
  benchmarkMessage: string | null;
  history: ChatTurn[];
  loading: boolean;
  chatError: string | null;
  onSend: (message: string) => void;
};

function AiStatusPanel({
  aiStatus,
  aiError,
  benchmarkState,
  benchmarkMessage,
}: {
  aiStatus: AiStatus | null;
  aiError: string | null;
  benchmarkState: BenchmarkUiState;
  benchmarkMessage: string | null;
}) {
  if (aiError) {
    return (
      <div className="px-4 py-2 border-b border-border bg-destructive/10">
        <p className="text-xs text-destructive">{aiError}</p>
      </div>
    );
  }

  if (!aiStatus) {
    return (
      <div className="px-4 py-2 border-b border-border">
        <p className="text-xs text-muted-foreground">Chargement du statut IA…</p>
      </div>
    );
  }

  if (!aiStatus.key_configured) {
    return (
      <div className="px-4 py-2 border-b border-border bg-secondary/40">
        <p className="text-xs font-medium text-foreground">IA désactivée</p>
        <p className="text-xs text-muted-foreground mt-1">
          Ajoutez{" "}
          <code className="font-mono text-[11px] bg-background px-1 rounded">
            OPENROUTER_API_KEY
          </code>{" "}
          dans le fichier <code className="font-mono text-[11px]">.env</code> à la racine de Fun,
          puis relancez l&apos;application.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border-b border-border bg-secondary/30 space-y-1">
      <p className="text-xs text-foreground">
        <span className="font-medium">Modèle actif :</span>{" "}
        {shortModelName(aiStatus.active_model)}
        <span className="text-muted-foreground"> ({modelSourceLabel(aiStatus.model_source)})</span>
      </p>
      {benchmarkState === "running" ? (
        <p className="text-xs text-muted-foreground">
          Évaluation des modèles free en cours… (1–2 min, connexion requise)
        </p>
      ) : null}
      {benchmarkMessage ? (
        <p className="text-xs text-muted-foreground">{benchmarkMessage}</p>
      ) : null}
    </div>
  );
}

function ChatGuide() {
  return (
    <div className="text-sm text-muted-foreground space-y-3 mt-4 px-1">
      <p className="text-center font-medium text-foreground">Comment parler à l&apos;assistant</p>
      <ul className="space-y-2 text-xs leading-relaxed">
        <li>
          <span className="font-semibold text-foreground">Claire</span> — relecture : « Que
          penses-tu de ce diagramme ? »
        </li>
        <li>
          <span className="font-semibold text-foreground">Trace</span> — dessin canvas : « Crée un
          diagramme de démo avec… » ou « Ajoute une boîte pour… »
        </li>
        <li>
          <span className="font-semibold text-foreground">Assistant</span> — questions générales
          (texte seulement, pas de dessin)
        </li>
        <li>
          <span className="font-semibold text-foreground">Reset</span> — « Repartir de zéro » vide
          le canvas
        </li>
      </ul>
      <p className="text-xs text-center text-muted-foreground">
        Fun dessine en Excalidraw sur le canvas — pas Mermaid. Ouvrez un diagramme ou demandez à Trace
        d&apos;en créer un.
      </p>
    </div>
  );
}

export function ChatSidebar({
  aiStatus,
  aiError,
  benchmarkState,
  benchmarkMessage,
  history,
  loading,
  chatError,
  onSend,
}: ChatSidebarProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 50;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, loading]);

  const canSend = input.trim().length > 0 && !loading && aiStatus?.key_configured;

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || loading || !aiStatus?.key_configured) return;
    onSend(trimmed);
    setInput("");
  }, [input, loading, aiStatus, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <aside className="flex flex-col w-80 border-l border-border bg-card" aria-label="Chat">
      <p className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
        Assistant IA
      </p>

      <AiStatusPanel
        aiStatus={aiStatus}
        aiError={aiError}
        benchmarkState={benchmarkState}
        benchmarkMessage={benchmarkMessage}
      />

      {chatError ? (
        <p className="px-4 py-2 text-xs text-destructive border-b border-border" role="alert">
          {chatError}
        </p>
      ) : null}

      <div
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
        ref={messagesContainerRef}
        role="log"
        aria-live="polite"
      >
        {history.length === 0 && !loading ? <ChatGuide /> : null}

        {history.map((turn, i) => {
          if (turn.role === "system") {
            return (
              <p
                key={i}
                className="text-xs text-center text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2"
                role="status"
              >
                {turn.content}
              </p>
            );
          }

          return (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-0.5",
                turn.role === "user" ? "items-end" : "items-start",
              )}
            >
              {turn.role === "assistant" && turn.personaDisplay ? (
                <span className="text-xs font-semibold text-muted-foreground">
                  {turn.personaDisplay}
                </span>
              ) : null}
              <p
                className={cn(
                  "text-sm rounded-lg px-3 py-2 max-w-[90%] whitespace-pre-wrap",
                  turn.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {turn.content}
              </p>
            </div>
          );
        })}

        {loading ? (
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-xs font-semibold text-muted-foreground">Assistant</span>
            <p className="text-sm text-muted-foreground italic">Réflexion en cours…</p>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-end gap-2 p-3 border-t border-border">
        <textarea
          className="flex-1 resize-none rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          rows={2}
          placeholder={
            aiStatus?.key_configured
              ? "Ex. « Que penses-tu de ce diagramme ? »"
              : "Configurez la clé API pour activer le chat"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!aiStatus?.key_configured || loading}
          aria-label="Message pour l'assistant"
        />
        <button
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Envoyer"
          title="Envoyer (Entrée)"
        >
          ↑
        </button>
      </div>
    </aside>
  );
}
