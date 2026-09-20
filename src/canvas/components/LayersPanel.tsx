import type { FunObject } from "../types";
import { displayObjectLabel } from "../utils/object-label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface LayersPanelProps {
  objects: FunObject[];
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  onUpdate: (id: string, patch: Partial<FunObject>) => void;
  onDelete: (ids: string[]) => void;
  onClose?: () => void;
}

export function LayersPanel({
  objects,
  selectedIds,
  onSelect,
  onUpdate,
  onDelete,
  onClose,
}: LayersPanelProps) {
  const sorted = [...objects].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <Card className="absolute left-3 top-3 w-56 overflow-hidden">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium">Calques</h3>
        {onClose && (
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            ×
          </Button>
        )}
      </div>
      <ScrollArea className="max-h-64">
        {sorted.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground">Aucun objet</p>
        ) : (
          sorted.map((obj) => (
            <div
              key={obj.id}
              className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent/50 ${
                selectedIds.has(obj.id) ? "bg-accent/30" : ""
              } ${obj.locked ? "opacity-70" : ""}`}
              onClick={(e) => onSelect(obj.id, e.ctrlKey || e.metaKey)}
            >
              <span className="text-xs text-muted-foreground w-4">
                {obj.type === "freehand" && "✎"}
                {obj.type === "rect" && "□"}
                {obj.type === "ellipse" && "○"}
                {obj.type === "diamond" && "◇"}
                {obj.type === "text" && "T"}
                {obj.type === "arrow" && "→"}
                {obj.type === "image" && "🖼"}
              </span>
              <span className="flex-1 text-xs truncate" title={displayObjectLabel(obj)}>
                {displayObjectLabel(obj)}
              </span>
              <Switch
                size="sm"
                checked={obj.locked}
                onCheckedChange={(checked) => onUpdate(obj.id, { locked: checked })}
                aria-label={obj.locked ? "Déverrouiller" : "Verrouiller"}
              />
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Supprimer"
                className="text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete([obj.id]);
                }}
              >
                ×
              </Button>
            </div>
          ))
        )}
      </ScrollArea>
    </Card>
  );
}
