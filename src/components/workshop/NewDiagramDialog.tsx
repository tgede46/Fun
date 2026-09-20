"use client";

import type { DiagramKind } from "@/lib/diagram";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type NewDiagramDialogProps = {
  open: boolean;
  onClose: () => void;
  onChoose: (kind: DiagramKind) => void;
};

const OPTIONS: { kind: DiagramKind; title: string; hint: string }[] = [
  { kind: "sketch", title: "Excalidraw (Sketch)", hint: "Vrai éditeur Excalidraw — fichier .excalidraw" },
  { kind: "drawio", title: "UML draw.io", hint: "Éditeur draw.io intégré" },
  { kind: "plantuml", title: "PlantUML", hint: "Code texte → rendu canvas" },
];

export function NewDiagramDialog({ open, onClose, onChoose }: NewDiagramDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Quel type de diagramme ?</DialogTitle>
          <DialogDescription>
            Un fichier est créé sous .fun/diagrams/ selon le format choisi.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 pt-2">
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
        <Button variant="outline" className="w-full mt-2" onClick={onClose}>
          Annuler
        </Button>
      </DialogContent>
    </Dialog>
  );
}
