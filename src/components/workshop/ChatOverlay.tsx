"use client";

import { useEffect, useRef } from "react";
import type { AiStatus, BenchmarkUiState, ChatTurn } from "@/lib/ai";
import { ChatSidebar } from "./ChatSidebar";

type ChatOverlayProps = {
  open: boolean;
  onClose: () => void;
  aiStatus: AiStatus | null;
  aiError: string | null;
  benchmarkState: BenchmarkUiState;
  benchmarkMessage: string | null;
  history: ChatTurn[];
  loading: boolean;
  chatError: string | null;
  onSend: (message: string) => void;
};

export function ChatOverlay({
  open,
  onClose,
  aiStatus,
  aiError,
  benchmarkState,
  benchmarkMessage,
  history,
  loading,
  chatError,
  onSend,
}: ChatOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-overlay/40"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-overlay-title"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p id="chat-overlay-title" className="text-sm font-semibold text-foreground">
              Assistant IA
            </p>
            <p className="text-xs text-muted-foreground">
              Fermer n’interrompt pas une réponse en cours.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent/50"
            onClick={onClose}
          >
            Fermer
          </button>
        </header>

        <div className="min-h-0 flex-1">
          <ChatSidebar
            variant="overlay"
            aiStatus={aiStatus}
            aiError={aiError}
            benchmarkState={benchmarkState}
            benchmarkMessage={benchmarkMessage}
            history={history}
            loading={loading}
            chatError={chatError}
            onSend={onSend}
          />
        </div>
      </div>
    </div>
  );
}
