"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type MeditationOverlayProps = {
  open: boolean;
  onDismiss: () => void;
};

export function MeditationOverlay({ open, onDismiss }: MeditationOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDismiss(); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Pause — respirez.</DialogTitle>
          <DialogDescription>
            Ferme les yeux un instant.
            <br />
            Inspire lentement…
            <br />
            Expire…
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-2">
          <Button onClick={onDismiss}>Reprendre</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
