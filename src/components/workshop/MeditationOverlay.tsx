"use client";

import { useEffect, useRef } from "react";

type MeditationOverlayProps = {
  open: boolean;
  onDismiss: () => void;
};

export function MeditationOverlay({ open, onDismiss }: MeditationOverlayProps) {
  const resumeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    resumeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="presentation">
      <div className="absolute inset-0 bg-overlay" aria-hidden="true" />
      <div
        className="relative z-10 flex flex-col items-center gap-6 rounded-2xl bg-card border border-border p-10 max-w-sm mx-4 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meditation-title"
      >
        <p id="meditation-title" className="text-xl font-semibold text-foreground">
          Pause — respirez.
        </p>
        <p className="text-center text-muted-foreground leading-relaxed">
          Ferme les yeux un instant.
          <br />
          Inspire lentement…
          <br />
          Expire…
        </p>
        <button
          ref={resumeRef}
          type="button"
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          onClick={onDismiss}
        >
          Reprendre
        </button>
      </div>
    </div>
  );
}
