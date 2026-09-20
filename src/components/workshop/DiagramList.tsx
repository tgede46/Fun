import { formatDiagramName } from "@/lib/format-diagram-name";
import { cn } from "@/lib/utils";
import type { DiagramKind, DiagramListItem } from "@/lib/diagram";
import { diagramPathsEqual, kindFromPath } from "@/lib/diagram-convert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DiagramListProps = {
  diagrams: DiagramListItem[];
  activePath: string | null;
  selectedPaths?: Set<string>;
  onSelect: (path: string) => void;
  onToggleSelect?: (path: string) => void;
  onDelete?: (path: string) => void;
  onConvert?: (path: string, kind: DiagramKind) => void;
};

const KIND_LABEL: Record<DiagramKind, string> = {
  sketch: "Excalidraw",
  drawio: "draw.io",
  plantuml: "PlantUML",
};

export function DiagramList({
  diagrams,
  activePath,
  selectedPaths,
  onSelect,
  onToggleSelect,
  onDelete,
  onConvert,
}: DiagramListProps) {
  if (diagrams.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Diagrammes du projet">
      <span className="text-xs text-muted-foreground px-2 shrink-0">Diagrammes</span>
      <ul className="flex gap-1">
        {diagrams.map((diagram) => {
          const isActive = diagramPathsEqual(diagram.path, activePath);
          const isSelected =
            [...(selectedPaths ?? [])].some((p) => diagramPathsEqual(p, diagram.path));
          const label = formatDiagramName(diagram.name);
          const kind = diagram.kind ?? kindFromPath(diagram.path);

          return (
            <li key={diagram.path} className="flex items-center">
              {onToggleSelect ? (
                <Button
                  variant={isSelected ? "default" : "ghost"}
                  size="icon-xs"
                  className="mr-0.5"
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
                </Button>
              ) : null}
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => onSelect(diagram.path)}
                aria-current={isActive ? "true" : undefined}
                title={diagram.name}
              >
                {label}
                <span
                  className={cn(
                    "ml-1 text-[10px] uppercase tracking-wide",
                    isActive ? "opacity-80" : "opacity-60",
                  )}
                >
                  {KIND_LABEL[kind]}
                </span>
              </Button>
              {onConvert ? (
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value) onConvert(diagram.path, value as DiagramKind);
                  }}
                >
                  <SelectTrigger className="ml-0.5 max-w-[7.5rem] h-6 text-[11px] border-0 bg-transparent">
                    <SelectValue placeholder="Dupliquer…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["sketch", "drawio", "plantuml"] as DiagramKind[])
                      .filter((target) => target !== kind)
                      .map((target) => (
                        <SelectItem key={target} value={target}>
                          en {KIND_LABEL[target]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : null}
              {onDelete ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className={cn(
                    "ml-0.5",
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
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
