import { cn } from "@/lib/utils";
import type { DiagramListItem } from "@/lib/diagram";

type DiagramListProps = {
  diagrams: DiagramListItem[];
  activePath: string | null;
  onSelect: (path: string) => void;
};

export function DiagramList({
  diagrams,
  activePath,
  onSelect,
}: DiagramListProps) {
  if (diagrams.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Diagrammes du projet">
      <span className="text-xs text-muted-foreground px-2 shrink-0">Diagrammes</span>
      <ul className="flex gap-1">
        {diagrams.map((diagram) => {
          const isActive = diagram.path === activePath;

          return (
            <li key={diagram.path}>
              <button
                type="button"
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
                onClick={() => onSelect(diagram.path)}
                aria-current={isActive ? "true" : undefined}
              >
                {diagram.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
