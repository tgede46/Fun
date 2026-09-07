import { formatDiagramName } from "@/lib/format-diagram-name";
import { cn } from "@/lib/utils";
import type { DiagramListItem } from "@/lib/diagram";

type DiagramListProps = {
  diagrams: DiagramListItem[];
  activePath: string | null;
  selectedPaths?: Set<string>;
  onSelect: (path: string) => void;
  onToggleSelect?: (path: string) => void;
  onDelete?: (path: string) => void;
};

export function DiagramList({
  diagrams,
  activePath,
  selectedPaths,
  onSelect,
  onToggleSelect,
  onDelete,
}: DiagramListProps) {
  if (diagrams.length === 0) {
    return null;
  }

  const hasSelection = selectedPaths && selectedPaths.size > 0;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Diagrammes du projet">
      <span className="text-xs text-muted-foreground px-2 shrink-0">Diagrammes</span>
      <ul className="flex gap-1">
        {diagrams.map((diagram) => {
          const isActive = diagram.path === activePath;
          const isSelected = selectedPaths?.has(diagram.path) ?? false;
          const label = formatDiagramName(diagram.name);

          return (
            <li key={diagram.path} className="flex items-center">
              {onToggleSelect ? (
                <button
                  type="button"
                  className={cn(
                    "mr-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-transparent hover:border-muted-foreground",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(diagram.path);
                  }}
                  aria-label={`Sélectionner ${label}`}
                  aria-pressed={isSelected}
                >
                  {isSelected ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </button>
              ) : null}
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
