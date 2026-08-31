import { useState } from "react";
import type { DiagramListItem } from "@/lib/diagram";
import type { FunTheme } from "@/lib/theme";
import type { FunScene } from "@/canvas/types";
import { DiagramList } from "./DiagramList";
import { FunCanvas } from "@/canvas/FunCanvas";
import dynamic from "next/dynamic";

const Canvas3D = dynamic(
  () => import("@/canvas3d/Canvas3D").then((mod) => mod.Canvas3D),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center">Chargement 3D...</div> },
);

type WorkshopMode = "sketch" | "uml" | "3d";

type CanvasAreaProps = {
  projectPath: string;
  theme: FunTheme;
  mode: WorkshopMode;
  diagrams: DiagramListItem[];
  activeDiagramPath: string | null;
  diagramName: string | null;
  scene: FunScene | null;
  error: string | null;
  saveError: string | null;
  codeGenError: string | null;
  onSelectDiagram: (path: string) => void;
  onDeleteDiagram?: (path: string) => void;
  onSaveError: (message: string | null) => void;
  onSceneChange?: (scene: FunScene) => void;
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
  diagrams,
  activeDiagramPath,
  diagramName,
  scene,
  error,
  saveError,
  codeGenError,
  onSelectDiagram,
  onDeleteDiagram,
  onSceneChange,
}: CanvasAreaProps) {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

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
            <p className="text-2xl font-bold text-foreground">UML structur</p>
            <p className="text-sm text-muted-foreground">
              Le mode UML formel arrive dans une prochaine version.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              En attendant, utilisez le mode <strong className="text-foreground">Sketch</strong>{" "}
              (icone a gauche) pour dessiner librement, ou{" "}
              <strong className="text-foreground">Depuis le code</strong> pour generer un diagramme
              depuis vos sources.
            </p>
          </div>
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
              : "Cliquez sur « Nouveau diagramme » dans la barre du haut pour ouvrir un canvas vierge."}
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            Astuce : « Depuis le code » scanne les fichiers sources du projet et genere un diagramme
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
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewMode === "2d"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            }`}
            onClick={() => setViewMode("2d")}
          >
            2D
          </button>
          <button
            type="button"
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewMode === "3d"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            }`}
            onClick={() => setViewMode("3d")}
          >
            3D
          </button>
        </div>
        {saveError ? (
          <p className="text-xs text-destructive ml-2" role="status">
            Sauvegarde echouee : {saveError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground ml-2 hidden sm:block">
            Sauvegarde automatique
          </p>
        )}
      </div>
      {viewMode === "2d" ? (
        <FunCanvas initialScene={scene} onSceneChange={onSceneChange} />
      ) : (
        <Canvas3D scene={scene} onSceneChange={onSceneChange} />
      )}
    </section>
  );
}