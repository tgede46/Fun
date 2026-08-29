import type { DiagramListItem, ExcalidrawInitialDataState } from "@/lib/diagram";
import type { FunTheme } from "@/lib/theme";
import { DiagramList } from "./DiagramList";
import { ExcalidrawCanvas, type ExcalidrawCanvasHandle } from "./ExcalidrawCanvas";
import type { RefObject } from "react";

type WorkshopMode = "sketch" | "uml";

type CanvasAreaProps = {
  projectPath: string;
  theme: FunTheme;
  mode: WorkshopMode;
  diagrams: DiagramListItem[];
  activeDiagramPath: string | null;
  diagramName: string | null;
  initialData: ExcalidrawInitialDataState | null;
  error: string | null;
  saveError: string | null;
  codeGenError: string | null;
  onSelectDiagram: (path: string) => void;
  onSaveError: (message: string) => void;
  canvasRef: RefObject<ExcalidrawCanvasHandle | null>;
};

export function CanvasArea({
  projectPath,
  theme,
  mode,
  diagrams,
  activeDiagramPath,
  diagramName,
  initialData,
  error,
  saveError,
  codeGenError,
  onSelectDiagram,
  onSaveError,
  canvasRef,
}: CanvasAreaProps) {
  const list = (
    <DiagramList
      diagrams={diagrams}
      activePath={activeDiagramPath}
      onSelect={onSelectDiagram}
    />
  );

  if (mode === "uml") {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 relative">
          {activeDiagramPath && initialData ? (
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <ExcalidrawCanvas
                ref={canvasRef}
                projectPath={projectPath}
                diagramPath={activeDiagramPath}
                theme={theme}
                initialData={initialData}
                onSaveError={onSaveError}
              />
            </div>
          ) : null}
          <div className="relative z-10 flex flex-col items-center gap-3 bg-card/90 backdrop-blur-sm rounded-2xl border border-border px-10 py-8 shadow-lg">
            <p className="text-2xl font-bold text-foreground">◫ UML</p>
            <p className="text-sm text-muted-foreground text-center">
              Le mode UML sera disponible prochainement.
            </p>
            <p className="text-xs text-muted-foreground">
              En attendant, utilisez le mode Sketch pour dessiner.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </section>
    );
  }

  if (codeGenError) {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-destructive">{codeGenError}</p>
        </div>
      </section>
    );
  }

  if (!initialData || !activeDiagramPath) {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6">
          <p className="text-lg font-semibold text-foreground">Nouveau diagramme</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {diagrams.length > 0
              ? "Sélectionnez un diagramme ci-dessus ou créez-en un nouveau via la barre d'outils."
              : "Cliquez sur « Nouveau diagramme » dans la barre d'outils pour commencer à dessiner."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
      <div className="flex items-center gap-3 p-3 border-b border-border">
        {list}
        <p className="text-sm font-medium text-foreground truncate">{diagramName}</p>
        {saveError ? (
          <p className="text-xs text-destructive ml-auto" role="status">
            {saveError}
          </p>
        ) : null}
      </div>
      <ExcalidrawCanvas
        ref={canvasRef}
        projectPath={projectPath}
        diagramPath={activeDiagramPath}
        theme={theme}
        initialData={initialData}
        onSaveError={onSaveError}
      />
    </section>
  );
}
