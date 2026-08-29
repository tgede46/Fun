import type { DiagramListItem, ExcalidrawInitialDataState } from "@/lib/diagram";
import type { FunTheme } from "@/lib/theme";
import { DiagramList } from "./DiagramList";
import { ExcalidrawCanvas } from "./ExcalidrawCanvas";

type CanvasAreaProps = {
  projectPath: string;
  theme: FunTheme;
  diagrams: DiagramListItem[];
  activeDiagramPath: string | null;
  diagramName: string | null;
  initialData: ExcalidrawInitialDataState | null;
  error: string | null;
  saveError: string | null;
  onSelectDiagram: (path: string) => void;
  onSaveError: (message: string) => void;
};

export function CanvasArea({
  projectPath,
  theme,
  diagrams,
  activeDiagramPath,
  diagramName,
  initialData,
  error,
  saveError,
  onSelectDiagram,
  onSaveError,
}: CanvasAreaProps) {
  const list = (
    <DiagramList
      diagrams={diagrams}
      activePath={activeDiagramPath}
      onSelect={onSelectDiagram}
    />
  );

  if (error) {
    return (
      <section className="workshop-canvas workshop-canvas--empty" aria-label="Canvas">
        {list}
        <p className="workshop-canvas__error">{error}</p>
      </section>
    );
  }

  if (!initialData || !activeDiagramPath) {
    return (
      <section className="workshop-canvas workshop-canvas--empty" aria-label="Canvas">
        {list}
        <p className="workshop-canvas__label">Nouveau diagramme</p>
        <p className="workshop-canvas__hint">
          {diagrams.length > 0
            ? "Sélectionnez un diagramme ci-dessus ou créez-en un nouveau via la barre d'outils."
            : "Cliquez sur « Nouveau diagramme » dans la barre d'outils pour commencer à dessiner."}
        </p>
      </section>
    );
  }

  return (
    <section className="workshop-canvas workshop-canvas--active" aria-label="Canvas">
      <div className="workshop-canvas__header">
        {list}
        <p className="workshop-canvas__title">{diagramName}</p>
        {saveError ? (
          <p className="workshop-canvas__save-error" role="status">
            {saveError}
          </p>
        ) : null}
      </div>
      <ExcalidrawCanvas
        projectPath={projectPath}
        diagramPath={activeDiagramPath}
        theme={theme}
        initialData={initialData}
        onSaveError={onSaveError}
      />
    </section>
  );
}
