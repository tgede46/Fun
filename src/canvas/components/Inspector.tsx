import type { FunObject } from "../types";

interface InspectorProps {
  selectedObjects: FunObject[];
  onUpdate: (id: string, patch: Partial<FunObject>) => void;
}

export function Inspector({ selectedObjects, onUpdate }: InspectorProps) {
  if (selectedObjects.length === 0) {
    return (
      <div className="absolute right-3 top-3 w-64 bg-card border border-border rounded-lg p-3 shadow-sm">
        <p className="text-sm text-muted-foreground">Sélectionnez un objet pour modifier ses propriétés</p>
      </div>
    );
  }

  if (selectedObjects.length > 1) {
    return (
      <div className="absolute right-3 top-3 w-64 bg-card border border-border rounded-lg p-3 shadow-sm">
        <p className="text-sm text-muted-foreground">{selectedObjects.length} objets sélectionnés</p>
      </div>
    );
  }

  const obj = selectedObjects[0];

  return (
    <div className="absolute right-3 top-3 w-64 bg-card border border-border rounded-lg p-3 shadow-sm">
      <h3 className="text-sm font-medium mb-3">Propriétés</h3>
      
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">X</label>
            <input
              type="number"
              value={Math.round(obj.x)}
              onChange={(e) => onUpdate(obj.id, { x: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Y</label>
            <input
              type="number"
              value={Math.round(obj.y)}
              onChange={(e) => onUpdate(obj.id, { y: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Largeur</label>
            <input
              type="number"
              value={Math.round(obj.width)}
              onChange={(e) => onUpdate(obj.id, { width: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Hauteur</label>
            <input
              type="number"
              value={Math.round(obj.height)}
              onChange={(e) => onUpdate(obj.id, { height: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Couleur de bordure</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={obj.stroke}
              onChange={(e) => onUpdate(obj.id, { stroke: e.target.value })}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={obj.stroke}
              onChange={(e) => onUpdate(obj.id, { stroke: e.target.value })}
              className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Couleur de remplissage</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={obj.fill === "transparent" ? "#ffffff" : obj.fill}
              onChange={(e) => onUpdate(obj.id, { fill: e.target.value })}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={obj.fill}
              onChange={(e) => onUpdate(obj.id, { fill: e.target.value })}
              className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Épaisseur de trait</label>
          <input
            type="range"
            min="1"
            max="20"
            value={obj.strokeWidth}
            onChange={(e) => onUpdate(obj.id, { strokeWidth: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Opacité</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={obj.opacity}
            onChange={(e) => onUpdate(obj.id, { opacity: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="locked"
            checked={obj.locked}
            onChange={(e) => onUpdate(obj.id, { locked: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="locked" className="text-xs text-muted-foreground">Verrouillé</label>
        </div>
      </div>
    </div>
  );
}