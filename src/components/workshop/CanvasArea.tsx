import type { DiagramListItem } from "@/lib/diagram";
import type { FunTheme } from "@/lib/theme";
import type { FunScene } from "@/canvas/types";
import { formatDiagramName } from "@/lib/format-diagram-name";
import { DiagramList } from "./DiagramList";
import { ExcalidrawCanvas } from "@/canvas/ExcalidrawCanvas";
import { DrawioEmbed } from "@/canvas/drawio/DrawioEmbed";

type WorkshopMode = "sketch" | "uml";

type CanvasAreaProps = {
  projectPath: string;
  theme: FunTheme;
  mode: WorkshopMode;
  focusMode: boolean;
  layersOpen: boolean;
  onLayersOpenChange: (open: boolean) => void;
  diagrams: DiagramListItem[];
  activeDiagramPath: string | null;
  diagramName: string | null;
  scene: FunScene | null;
  error: string | null;
  saveError: string | null;
  codeGenError: string | null;
  drawioXml: string | null;
  onSelectDiagram: (path: string) => void;
  onDeleteDiagram?: (path: string) => void;
  onSaveError: (message: string | null) => void;
  onSceneChange?: (scene: FunScene) => void;
  onCreateDrawioDiagram: () => void;
  onDrawioXmlChange?: (xml: string) => void;
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

function BienTotOverlay({ onCreateDiagram }: { onCreateDiagram: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-canvas/80">
      <div className="text-center p-8">
        <div className="text-4xl mb-4 opacity-50">
          {"\u256B"}
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Mode UML</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Le mode UML est en cours de d\u00e9veloppement. Utilisez draw.io int\u00e9gr\u00e9 pour cr\u00e9er vos diagrammes UML.
        </p>
        <button
          onClick={onCreateDiagram}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          Cr\u00e9er un nouveau diagramme UML
        </button>
      </div>
    </div>
  );
}

export function CanvasArea({
  mode,
  focusMode,
  layersOpen,
  onLayersOpenChange,
  diagrams,
  activeDiagramPath,
  diagramName,
  scene,
  error,
  saveError,
  codeGenError,
  drawioXml,
  onSelectDiagram,
  onDeleteDiagram,
  onSaveError,
  onSceneChange,
  onCreateDrawioDiagram,
  onDrawioXmlChange,
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
    const hasDiagram = activeDiagramPath != null && drawioXml != null;

    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas relative" aria-label="Canvas UML">
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 relative">
          {/* draw.io int\u00e9gr\u00e9 */}
          <div className="absolute inset-0">
            <DrawioEmbed
              initialXml={drawioXml}
              onXmlChange={onDrawioXmlChange}
            />
          </div>

          {/* Placeholder "Bient\u00f4t" quand pas de diagramme */}
          {!hasDiagram && (
            <BienTotOverlay onCreateDiagram={onCreateDrawioDiagram} />
          )}
        </div>
      </section>
    );
  }

  if (error && !scene) {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-destructive text-center max-w-md">{error}</p>
        </div>
      </section>
    );
  }

  if (!scene || !activeDiagramPath) {
    return (
      <section className="flex flex-col flex-1 min-w-0 bg-canvas" aria-label="Canvas">
        {codeGenError ? <StatusBanner message={codeGenError} tone="error" /> : null}
        <div className="p-3 border-b border-border">{list}</div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <p className="text-lg font-semibold text-foreground">Commencer a dessiner</p>
          <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
            {diagrams.length > 0
              ? "Choisissez un diagramme dans la liste ci-dessus, ou creez-en un nouveau."
              : "Cliquez sur \u00ab Nouveau diagramme \u00bb dans la barre du haut pour ouvrir un canvas vierge."}
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            Astuce : \u00ab Depuis le code \u00bb scanne les fichiers sources du projet et genere un diagramme
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
        <p className="text-sm font-medium text-foreground truncate">
          {diagramName ? formatDiagramName(diagramName) : null}
        </p>
        <div className="ml-auto">
          {saveError ? (
            <p className="text-xs text-destructive" role="status">
              Sauvegarde \u00e9choue\u00e9e : {saveError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground hidden sm:block">
              Sauvegarde automatique
            </p>
          )}
        </div>
      </div>
      <ExcalidrawCanvas
        initialScene={scene}
        onSceneChange={onSceneChange}
        focusMode={focusMode}
        layersOpen={layersOpen}
        onLayersOpenChange={onLayersOpenChange}
      />
    </section>
  );
}
