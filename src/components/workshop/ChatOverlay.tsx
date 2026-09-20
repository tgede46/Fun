"use client";

import { useCallback, useState } from "react";
import type { AiStatus, BenchmarkUiState, ChatTurn } from "@/lib/ai";
import { ChatSidebar } from "./ChatSidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  onImageFile?: (file: File) => void;
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
  onImageFile,
}: ChatOverlayProps) {
  const [confirmClose, setConfirmClose] = useState(false);

  const handleClose = useCallback(() => {
    if (loading) {
      setConfirmClose(true);
      return;
    }
    onClose();
  }, [loading, onClose]);

  const confirmCloseAction = useCallback(() => {
    setConfirmClose(false);
    onClose();
  }, [onClose]);

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
        <SheetContent side="right" showCloseButton={false} className="p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle>Assistant IA</SheetTitle>
            <SheetDescription>
              Fermer n&apos;interrompt pas une réponse en cours.
            </SheetDescription>
            <Button variant="outline" size="sm" onClick={handleClose} className="absolute right-4 top-3">
              Fermer
            </Button>
          </SheetHeader>
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
              onImageFile={onImageFile}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fermer l&apos;assistant ?</DialogTitle>
            <DialogDescription>
              Une réponse est en cours. Fermer l&apos;overlay n&apos;interrompt pas le traitement, mais tu ne verras pas la réponse apparaître. Continuer ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfirmClose(false)}>
              Rester
            </Button>
            <Button variant="destructive" onClick={confirmCloseAction}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
