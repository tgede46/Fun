"use client";

import { useState } from "react";
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

  const handleGenerate = () => {
    try {
      const next = plantumlToFunScene(source, { sourceFormat: "plantuml" });
      setError(null);
      onGenerate(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse PlantUML impossible.");
    }
  };

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-medium text-foreground">PlantUML</p>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            onClick={handleGenerate}
          >
            Générer
          </button>
        </div>
        <textarea
          className="min-h-0 flex-1 resize-none bg-background px-3 py-2 font-mono text-xs text-foreground focus:outline-none"
          value={source}
          spellCheck={false}
          onChange={(event) => onSourceChange(event.target.value)}
          aria-label="Source PlantUML"
        />
        {error ? (
          <p className="border-t border-border px-3 py-2 text-xs text-destructive">{error}</p>
        ) : (
          <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            Écris le code, puis clique Générer pour le voir sur le canvas.
          </p>
        )}
      </aside>
      <div className="min-w-0 flex-1">
        {scene ? (
          <FunCanvas
            key={scene.id ?? "plantuml-scene"}
            initialScene={scene}
            focusMode={focusMode}
            layersOpen={layersOpen}
            onLayersOpenChange={onLayersOpenChange}
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
