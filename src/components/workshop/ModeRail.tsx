import { cn } from "@/lib/utils";

export type WorkshopMode = "sketch" | "uml";

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
        title="Sketch — dessin libre Excalidraw"
        aria-label="Mode Sketch"
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
        title="UML — draw.io"
        aria-label="Mode UML"
        aria-pressed={activeMode === "uml"}
        onClick={() => onModeChange?.("uml")}
      >
        ◫
      </button>
    </nav>
  );
}
