import type { DiagramKind, DiagramListItem } from "@/lib/diagram";
import type { FunTheme } from "@/lib/theme";
import type { FunScene } from "@/canvas/types";
import { formatDiagramName } from "@/lib/format-diagram-name";
import { kindFromPath } from "@/lib/diagram-convert";
import { DiagramList } from "./DiagramList";
import { FunCanvas } from "@/canvas/FunCanvas";
import { DrawioEmbed } from "@/canvas/drawio/DrawioEmbed";
import { PlantUmlEditor } from "./PlantUmlEditor";
import type { WorkshopMode } from "./ModeRail";

type CanvasAreaProps = {
  projectPath: string;
  theme: FunTheme;
  mode: WorkshopMode;
  focusMode: boolean;
  layersOpen: boolean;
  onLayersOpenChange: (open: boolean) => void;
  diagrams: DiagramListItem[];
  activeDiagramPath: string | null;
  selectedDiagramPaths?: Set<string>;
  diagramName: string | null;
  scene: FunScene | null;
  plantumlSource: string | null;
  error: string | null;
  saveError: string | null;
  codeGenError: string | null;
  convertMessage: string | null;
  drawioXml: string | null;
  onSelectDiagram: (path: string) => void;
  onToggleSelectDiagram?: (path: string) => void;
  onDeleteDiagram?: (path: string) => void;
  onConvertDiagram?: (path: string, kind: DiagramKind) => void;
  onSaveError: (message: string | null) => void;
  onSceneChange?: (scene: FunScene) => void;
  onCreateDrawioDiagram: () => void;
  onDrawioXmlChange?: (xml: string) => void;
  onPlantumlSourceChange?: (source: string) => void;
  onPlantumlGenerate?: (scene: FunScene) => void;
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
  mode,
  focusMode,
  layersOpen,
  onLayersOpenChange,
  diagrams,
  activeDiagramPath,
  selectedDiagramPaths,
  diagramName,
  scene,
  plantumlSource,
  error,
  saveError,
  codeGenError,
  convertMessage,
  drawioXml,
  onSelectDiagram,
  onToggleSelectDiagram,
  onDeleteDiagram,
  onConvertDiagram,
  onSceneChange,
  onCreateDrawioDiagram,
  onDrawioXmlChange,
  onPlantumlSourceChange,
  onPlantumlGenerate,
}: CanvasAreaProps) {
  const fileKind = activeDiagramPath ? kindFromPath(activeDiagramPath) : null;
  const viewKind: DiagramKind =
    fileKind ?? (mode === "uml" ? "drawio" : mode === "plantuml" ? "plantuml" : "sketch");

  const list = (
    <DiagramList
      diagrams={diagrams}
      activePath={activeDiagramPath}
      selectedPaths={selectedDiagramPaths}
      onSelect={onSelectDiagram}
      onToggleSelect={onToggleSelectDiagram}
      onDelete={onDeleteDiagram}
      onConvert={onConvertDiagram}
    />
  );

  const header = (
    <div className="flex items-center gap-3 p-3 border-b border-border">
      {list}
      <p className="text-sm font-medium text-foreground truncate">
        {diagramName ? formatDiagramName(diagramName) : null}
      </p>
      <div className="ml-auto">
        {saveError ? (
          <p className="text-xs text-destructive" role="status">
            Sauvegarde échouée : {saveError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground hidden sm:block">
            Sauvegarde automatique
          </p>
        )}
      </div>
    </div>
  );

  if (error && !scene && !drawioXml && !plantumlSource) {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-destructive text-center max-w-md">{error}</p>
        </div>
      </section>
    );
  }

  if (!activeDiagramPath) {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        {codeGenError ? <StatusBanner message={codeGenError} tone="error" /> : null}
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <p className="text-lg font-semibold text-foreground">Commencer a dessiner</p>
          <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
            {diagrams.length > 0
              ? "Choisissez un diagramme dans la liste ci-dessus, ou creez-en un nouveau."
              : "Cliquez sur « Nouveau diagramme » pour choisir Sketch, draw.io ou PlantUML."}
          </p>
          {viewKind === "drawio" ? (
            <button
              type="button"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
              onClick={onCreateDrawioDiagram}
            >
              Créer un diagramme UML
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
      {codeGenError ? <StatusBanner message={codeGenError} tone="error" /> : null}
      {convertMessage ? <StatusBanner message={convertMessage} tone="info" /> : null}
      {header}
      {viewKind === "drawio" ? (
        <div className="relative flex-1">
          <div className="absolute inset-0">
            <DrawioEmbed initialXml={drawioXml} onXmlChange={onDrawioXmlChange} />
          </div>
        </div>
      ) : viewKind === "plantuml" ? (
        <PlantUmlEditor
          source={plantumlSource ?? "@startuml\n@enduml\n"}
          scene={scene}
          focusMode={focusMode}
          layersOpen={layersOpen}
          onLayersOpenChange={onLayersOpenChange}
          onSourceChange={(next) => onPlantumlSourceChange?.(next)}
          onGenerate={(next) => onPlantumlGenerate?.(next)}
        />
      ) : scene ? (
        <FunCanvas
          key={activeDiagramPath}
          initialScene={scene}
          onSceneChange={onSceneChange}
          focusMode={focusMode}
          layersOpen={layersOpen}
          onLayersOpenChange={onLayersOpenChange}
        />
      ) : null}
    </section>
  );
}
