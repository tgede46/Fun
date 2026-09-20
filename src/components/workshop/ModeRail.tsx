import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type WorkshopMode = "sketch" | "uml" | "plantuml";

type ModeRailProps = {
  activeMode?: WorkshopMode;
  onModeChange?: (mode: WorkshopMode) => void;
};

export function ModeRail({ activeMode = "sketch", onModeChange }: ModeRailProps) {
  return (
    <nav className="flex flex-col gap-1 p-2 border-r border-border bg-card" aria-label="Modes atelier">
      <Button
        variant={activeMode === "sketch" ? "default" : "ghost"}
        size="icon"
        title="Excalidraw — ouvrir ou créer un croquis"
        aria-label="Mode Sketch / Excalidraw"
        aria-pressed={activeMode === "sketch"}
        onClick={() => onModeChange?.("sketch")}
      >
        ✎
      </Button>
      <Button
        variant={activeMode === "uml" ? "default" : "ghost"}
        size="icon"
        title="draw.io — ouvrir ou créer un UML"
        aria-label="Mode UML"
        aria-pressed={activeMode === "uml"}
        onClick={() => onModeChange?.("uml")}
      >
        ◫
      </Button>
      <Button
        variant={activeMode === "plantuml" ? "default" : "ghost"}
        size="icon"
        title="PlantUML — ouvrir ou créer un diagramme code"
        aria-label="Mode PlantUML"
        aria-pressed={activeMode === "plantuml"}
        onClick={() => onModeChange?.("plantuml")}
      >
        {"{ }"}
      </Button>
    </nav>
  );
}
