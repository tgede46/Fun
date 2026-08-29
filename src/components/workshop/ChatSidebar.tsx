import { useCallback, useEffect, useRef, useState } from "react";
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
    <aside className="workshop-chat" aria-label="Chat">
      <p className="workshop-chat__label">Chat</p>

      {aiError ? (
        <p className="workshop-chat__error">{aiError}</p>
      ) : null}

      {chatError ? (
        <p className="workshop-chat__error">{chatError}</p>
      ) : null}

      {aiStatus && !aiStatus.key_configured ? (
        <p className="workshop-chat__hint">
          Définissez OPENROUTER_API_KEY dans le fichier .env à la racine du
          projet.
        </p>
      ) : null}

      <div
        className="workshop-chat__messages"
        ref={messagesContainerRef}
        role="log"
        aria-live="polite"
      >
        {history.length === 0 && !loading ? (
          <p className="workshop-chat__empty">
            Posez une question sur votre diagramme ou demandez une modification.
          </p>
        ) : (
          history.map((turn, i) => (
            <div
              key={i}
              className={`workshop-chat__message workshop-chat__message--${turn.role}`}
            >
              {turn.role === "assistant" ? (
                <span className="workshop-chat__persona">Claire</span>
              ) : null}
              <p className="workshop-chat__message-text">{turn.content}</p>
            </div>
          ))
        )}

        {loading ? (
          <div className="workshop-chat__message workshop-chat__message--assistant">
            <span className="workshop-chat__persona">Claire</span>
            <p className="workshop-chat__typing">IA en cours…</p>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <div className="workshop-chat__input-area">
        <textarea
          className="workshop-chat__input"
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
          className="workshop-chat__send"
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
