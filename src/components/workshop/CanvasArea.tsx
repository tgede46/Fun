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
  onDeleteDiagram?: (path: string) => void;
  onSaveError: (message: string | null) => void;
  onDiagramSaved?: (content: string) => void;
  canvasRef: RefObject<ExcalidrawCanvasHandle | null>;
};

function StatusBanner({ message, tone }: { message: string; tone: "error" | "info" }) {
  return (
    <p
      className={
        tone === "error"
          ? "text-xs text-destructive bg-destructive/10 border-b border-border px-4 py-2"
          : "text-xs text-muted-foreground bg-secondary/40 border-b border-border px-4 py-2"
      }
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

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
  onDeleteDiagram,
  onSaveError,
  onDiagramSaved,
  canvasRef,
}: CanvasAreaProps) {
  const list = (
    <DiagramList
      diagrams={diagrams}
      activePath={activeDiagramPath}
      onSelect={onSelectDiagram}
      onDelete={onDeleteDiagram}
    />
  );

  if (mode === "uml") {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="flex flex-col items-center gap-3 bg-card rounded-2xl border border-border px-10 py-8 shadow-sm max-w-md text-center">
            <p className="text-2xl font-bold text-foreground">◫ UML structuré</p>
            <p className="text-sm text-muted-foreground">
              Le mode draw.io (diagrammes UML formels) arrive dans une prochaine version.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              En attendant, utilisez le mode <strong className="text-foreground">Sketch</strong>{" "}
              (icône ✎ à gauche) pour dessiner librement, ou{" "}
              <strong className="text-foreground">Depuis le code</strong> pour générer un diagramme
              depuis vos sources.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error && !initialData) {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-destructive text-center max-w-md">{error}</p>
        </div>
      </section>
    );
  }

  if (!initialData || !activeDiagramPath) {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        {codeGenError ? <StatusBanner message={codeGenError} tone="error" /> : null}
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <p className="text-lg font-semibold text-foreground">Commencer à dessiner</p>
          <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
            {diagrams.length > 0
              ? "Choisissez un diagramme dans la liste ci-dessus, ou créez-en un nouveau."
              : "Cliquez sur « Nouveau diagramme » dans la barre du haut pour ouvrir un canvas vierge."}
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            Astuce : « Depuis le code » scanne les fichiers sources du projet et génère un diagramme
            automatiquement (connexion IA requise).
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
      {codeGenError ? <StatusBanner message={codeGenError} tone="error" /> : null}
      <div className="flex items-center gap-3 p-3 border-b border-border">
        {list}
        <p className="text-sm font-medium text-foreground truncate">{diagramName}</p>
        {saveError ? (
          <p className="text-xs text-destructive ml-auto" role="status">
            Sauvegarde échouée : {saveError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground ml-auto hidden sm:block">
            Sauvegarde automatique
          </p>
        )}
      </div>
      <ExcalidrawCanvas
        ref={canvasRef}
        projectPath={projectPath}
        diagramPath={activeDiagramPath}
        theme={theme}
        initialData={initialData}
        onSaveError={onSaveError}
        onSaved={onDiagramSaved}
      />
    </section>
  );
}
