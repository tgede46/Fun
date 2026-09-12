"use client";

import { useCallback, useRef, useState } from "react";
import { FunCanvas } from "@/canvas/FunCanvas";
import { plantumlToFunScene } from "@/canvas/adapters/plantuml";
import type { FunScene } from "@/canvas/types";

type PlantUmlEditorProps = {
  source: string;
  scene: FunScene | null;
  focusMode: boolean;
  layersOpen: boolean;
  onLayersOpenChange: (open: boolean) => void;
  onSourceChange: (source: string) => void;
  onGenerate: (scene: FunScene) => void;
};

function insertAtCursor(
  value: string,
  insert: string,
  start: number,
  end: number,
): { next: string; caret: number } {
  const next = value.slice(0, start) + insert + value.slice(end);
  return { next, caret: start + insert.length };
}

export function PlantUmlEditor({
  source,
  scene,
  focusMode,
  layersOpen,
  onLayersOpenChange,
  onSourceChange,
  onGenerate,
}: PlantUmlEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyInsert = useCallback(
    (text: string) => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? source.length;
      const end = el?.selectionEnd ?? source.length;
      const { next, caret } = insertAtCursor(source, text, start, end);
      onSourceChange(next);
      requestAnimationFrame(() => {
        const node = textareaRef.current;
        if (!node) return;
        node.focus();
        node.setSelectionRange(caret, caret);
      });
    },
    [onSourceChange, source],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const text =
        event.clipboardData.getData("text/plain") ||
        event.clipboardData.getData("text");
      if (!text) {
        setPasteHint("Presse-papiers vide — utilise le bouton Coller.");
        return;
      }
      setPasteHint(null);
      applyInsert(text);
    },
    [applyInsert],
  );

  const handlePasteButton = useCallback(async () => {
    setPasteHint(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setPasteHint("Presse-papiers vide.");
        return;
      }
      applyInsert(text);
    } catch {
      setPasteHint(
        "Collage bloqué par le système — autorise le presse-papiers ou Ctrl+Shift+V.",
      );
      textareaRef.current?.focus();
    }
  }, [applyInsert]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Empêche le canvas / les raccourcis atelier d’avaler Ctrl+V / Cmd+V
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
        event.stopPropagation();
      }
    },
    [],
  );

  const handleGenerate = () => {
    try {
      const next = plantumlToFunScene(source, { sourceFormat: "plantuml" });
      if (next.objects.length === 0) {
        setError(
          "Aucune entité reconnue.\nClasses : class A / class B / A --> B\nActivité : start / :Action; / if (...) / stop",
        );
        return;
      }
      setError(null);
      onGenerate(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse PlantUML impossible.");
    }
  };

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="relative z-20 flex w-80 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <p className="text-sm font-medium text-foreground">PlantUML</p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              onClick={() => void handlePasteButton()}
              title="Coller depuis le presse-papiers"
            >
              Coller
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              onClick={handleGenerate}
            >
              Générer
            </button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          className="min-h-0 flex-1 resize-none bg-background px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
          value={source}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          onChange={(event) => onSourceChange(event.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          aria-label="Source PlantUML"
          placeholder={"@startuml\nclass A\nclass B\nA --> B\n@enduml"}
        />
        {error ? (
          <p className="whitespace-pre-wrap border-t border-border px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : pasteHint ? (
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            {pasteHint}
          </p>
        ) : (
          <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            Écris ou colle du PlantUML (Ctrl+V / bouton Coller), puis Générer.
          </p>
        )}
      </aside>
      <div className="relative z-0 min-w-0 flex-1">
        {scene ? (
          <FunCanvas
            key={scene.id ?? "plantuml-scene"}
            initialScene={scene}
            focusMode={focusMode}
            layersOpen={layersOpen}
            onLayersOpenChange={onLayersOpenChange}
            previewMode
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            Clique Générer pour afficher le diagramme.
          </div>
        )}
      </div>
    </div>
  );
}
