import { cn } from "@/lib/utils";

export type WorkshopMode = "sketch" | "uml" | "plantuml";

type ModeRailProps = {
  activeMode?: WorkshopMode;
  onModeChange?: (mode: WorkshopMode) => void;
};

export function ModeRail({ activeMode = "sketch", onModeChange }: ModeRailProps) {
  return (
    <nav className="flex flex-col gap-1 p-2 border-r border-border bg-card" aria-label="Modes atelier">
      <button
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-lg text-lg transition-colors",
          activeMode === "sketch"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
        type="button"
        title="Excalidraw — ouvrir ou créer un croquis"
        aria-label="Mode Sketch / Excalidraw"
        aria-pressed={activeMode === "sketch"}
        onClick={() => onModeChange?.("sketch")}
      >
        ✎
      </button>
      <button
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-lg text-lg transition-colors",
          activeMode === "uml"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
        type="button"
        title="draw.io — ouvrir ou créer un UML"
        aria-label="Mode UML"
        aria-pressed={activeMode === "uml"}
        onClick={() => onModeChange?.("uml")}
      >
        ◫
      </button>
      <button
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-lg text-lg transition-colors",
          activeMode === "plantuml"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
        type="button"
        title="PlantUML — ouvrir ou créer un diagramme code"
        aria-label="Mode PlantUML"
        aria-pressed={activeMode === "plantuml"}
        onClick={() => onModeChange?.("plantuml")}
      >
        {"{ }"}
      </button>
    </nav>
  );
}
