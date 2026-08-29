"use client";

import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    confirmRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="presentation">
      <div
        className="absolute inset-0 bg-overlay"
        aria-hidden="true"
        onClick={loading ? undefined : onCancel}
      />
      <div
        className="relative z-10 flex flex-col gap-4 rounded-2xl bg-card border border-border p-6 max-w-md mx-4 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <p id="confirm-dialog-title" className="text-lg font-semibold text-foreground">
          {title}
        </p>
        <p id="confirm-dialog-message" className="text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="px-3 py-1.5 text-sm rounded-md bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Suppression…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
