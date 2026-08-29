import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { AiStatus, ChatTurn } from "@/lib/ai";

type ChatSidebarProps = {
  aiStatus: AiStatus | null;
  aiError: string | null;
  history: ChatTurn[];
  loading: boolean;
  chatError: string | null;
  onSend: (message: string) => void;
};

export function ChatSidebar({
  aiStatus,
  aiError,
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
        Chat
      </p>

      {aiError ? (
        <p className="px-4 py-2 text-xs text-destructive">{aiError}</p>
      ) : null}

      {chatError ? (
        <p className="px-4 py-2 text-xs text-destructive">{chatError}</p>
      ) : null}

      {aiStatus && !aiStatus.key_configured ? (
        <p className="px-4 py-2 text-xs text-muted-foreground">
          Définissez OPENROUTER_API_KEY dans le fichier .env à la racine du projet.
        </p>
      ) : null}

      <div
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
        ref={messagesContainerRef}
        role="log"
        aria-live="polite"
      >
        {history.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Posez une question sur votre diagramme ou demandez une modification.
          </p>
        ) : (
          history.map((turn, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-0.5",
                turn.role === "user" ? "items-end" : "items-start",
              )}
            >
              {turn.role === "assistant" ? (
                <span className="text-xs font-semibold text-muted-foreground">Claire</span>
              ) : null}
              <p
                className={cn(
                  "text-sm rounded-lg px-3 py-2 max-w-[90%]",
                  turn.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {turn.content}
              </p>
            </div>
          ))
        )}

        {loading ? (
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-xs font-semibold text-muted-foreground">Claire</span>
            <p className="text-sm text-muted-foreground italic">IA en cours…</p>
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
              ? "Demandez quelque chose…"
              : "Clé API non configurée"
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
        >
          ↑
        </button>
      </div>
    </aside>
  );
}
