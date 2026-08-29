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
    <div className="workshop-meditation" role="presentation">
      <div className="workshop-meditation__scrim" aria-hidden="true" />
      <div
        className="workshop-meditation__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meditation-title"
      >
        <p id="meditation-title" className="workshop-meditation__title">
          Pause — respirez.
        </p>
        <p className="workshop-meditation__text">
          Ferme les yeux un instant.
          <br />
          Inspire lentement…
          <br />
          Expire…
        </p>
        <button
          ref={resumeRef}
          type="button"
          className="workshop-meditation__resume"
          onClick={onDismiss}
        >
          Reprendre
        </button>
      </div>
    </div>
  );
}
