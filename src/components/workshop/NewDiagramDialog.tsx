"use client";

import type { DiagramKind } from "@/lib/diagram";

type NewDiagramDialogProps = {
  open: boolean;
  onClose: () => void;
  onChoose: (kind: DiagramKind) => void;
};

const OPTIONS: { kind: DiagramKind; title: string; hint: string }[] = [
  { kind: "sketch", title: "Sketch", hint: "Dessin libre sur le canvas Fun" },
  { kind: "drawio", title: "UML draw.io", hint: "Éditeur draw.io intégré" },
  { kind: "plantuml", title: "PlantUML", hint: "Code texte → rendu canvas" },
];

export function NewDiagramDialog({ open, onClose, onChoose }: NewDiagramDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-overlay/50"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
        role="dialog"
        aria-labelledby="new-diagram-title"
      >
        <h2 id="new-diagram-title" className="text-base font-semibold text-foreground">
          Quel type de diagramme ?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Un fichier est créé sous .fun/diagrams/ selon le format choisi.
        </p>
        <div className="mt-4 grid gap-2">
          {OPTIONS.map((option) => (
            <button
              key={option.kind}
              type="button"
              className="rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-accent/50"
              onClick={() => onChoose(option.kind)}
            >
              <p className="text-sm font-medium text-foreground">{option.title}</p>
              <p className="text-xs text-muted-foreground">{option.hint}</p>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50"
          onClick={onClose}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
