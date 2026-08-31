import type { FunObject } from "../types";

interface LayersPanelProps {
  objects: FunObject[];
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  onUpdate: (id: string, patch: Partial<FunObject>) => void;
  onDelete: (ids: string[]) => void;
}

export function LayersPanel({
  objects,
  selectedIds,
  onSelect,
  onUpdate,
  onDelete,
}: LayersPanelProps) {
  const sorted = [...objects].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="absolute left-3 top-3 w-56 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="p-2 border-b border-border">
        <h3 className="text-sm font-medium">Calques</h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground">Aucun objet</p>
        ) : (
          sorted.map((obj) => (
            <div
              key={obj.id}
              className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent/50 ${
                selectedIds.has(obj.id) ? "bg-accent/30" : ""
              }`}
              onClick={(e) => onSelect(obj.id, e.ctrlKey || e.metaKey)}
            >
              <span className="text-xs text-muted-foreground w-4">
                {obj.type === "freehand" && "✎"}
                {obj.type === "rect" && "□"}
                {obj.type === "ellipse" && "○"}
                {obj.type === "diamond" && "◇"}
                {obj.type === "text" && "T"}
                {obj.type === "arrow" && "→"}
              </span>
              <span className="flex-1 text-xs truncate">
                {obj.type === "text" ? (obj as any).text : obj.type}
              </span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(obj.id, { locked: !obj.locked });
                }}
              >
                {obj.locked ? "🔒" : "🔓"}
              </button>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete([obj.id]);
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}