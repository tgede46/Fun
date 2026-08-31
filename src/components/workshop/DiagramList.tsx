import { formatDiagramName } from "@/lib/format-diagram-name";
import { cn } from "@/lib/utils";
import type { DiagramListItem } from "@/lib/diagram";

type DiagramListProps = {
  diagrams: DiagramListItem[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onDelete?: (path: string) => void;
};

export function DiagramList({
  diagrams,
  activePath,
  onSelect,
  onDelete,
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
          const label = formatDiagramName(diagram.name);

          return (
            <li key={diagram.path} className="flex items-center">
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
                title={diagram.name}
              >
                {label}
              </button>
              {onDelete ? (
                <button
                  type="button"
                  className={cn(
                    "ml-0.5 px-1.5 py-1 text-xs rounded-md transition-colors",
                    isActive
                      ? "text-primary-foreground/80 hover:bg-primary-foreground/20"
                      : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(diagram.path);
                  }}
                  aria-label={`Supprimer ${label}`}
                  title={`Supprimer ${label}`}
                >
                  ×
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
