import type { FunObject } from "../types";
import { displayObjectLabel } from "../utils/object-label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface InspectorProps {
  selectedObjects: FunObject[];
  onUpdate: (id: string, patch: Partial<FunObject>) => void;
}

export function Inspector({ selectedObjects, onUpdate }: InspectorProps) {
  if (selectedObjects.length === 0) {
    return (
      <Card className="absolute right-3 top-3 w-64">
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sélectionnez un objet pour modifier ses propriétés
          </p>
        </CardContent>
      </Card>
    );
  }

  if (selectedObjects.length > 1) {
    return (
      <Card className="absolute right-3 top-3 w-64">
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {selectedObjects.length} objets sélectionnés
          </p>
        </CardContent>
      </Card>
    );
  }

  const obj = selectedObjects[0];

  return (
    <Card className="absolute right-3 top-3 w-64 max-h-[80vh] overflow-y-auto">
      <CardContent>
        <h3 className="text-sm font-medium mb-3">Propriétés</h3>

        <div className="space-y-2">
          <div>
            <Label htmlFor={`label-${obj.id}`} className="text-xs text-muted-foreground">
              Nom du calque
            </Label>
            <Input
              id={`label-${obj.id}`}
              type="text"
              value={obj.label ?? displayObjectLabel(obj)}
              onChange={(e) => onUpdate(obj.id, { label: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">X</Label>
              <Input
                type="number"
                value={Math.round(obj.x)}
                disabled={obj.locked}
                onChange={(e) => onUpdate(obj.id, { x: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Y</Label>
              <Input
                type="number"
                value={Math.round(obj.y)}
                disabled={obj.locked}
                onChange={(e) => onUpdate(obj.id, { y: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Largeur</Label>
              <Input
                type="number"
                value={Math.round(obj.width)}
                disabled={obj.locked}
                onChange={(e) => onUpdate(obj.id, { width: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Hauteur</Label>
              <Input
                type="number"
                value={Math.round(obj.height)}
                disabled={obj.locked}
                onChange={(e) => onUpdate(obj.id, { height: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Couleur de bordure</Label>
            <div className="flex gap-2 items-center mt-1">
              <input
                type="color"
                value={obj.stroke}
                disabled={obj.locked}
                onChange={(e) => onUpdate(obj.id, { stroke: e.target.value })}
                className="w-8 h-8 rounded border border-border cursor-pointer disabled:opacity-50"
              />
              <Input
                type="text"
                value={obj.stroke}
                disabled={obj.locked}
                onChange={(e) => onUpdate(obj.id, { stroke: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Couleur de remplissage</Label>
            <div className="flex gap-2 items-center mt-1">
              <input
                type="color"
                value={obj.fill === "transparent" ? "#ffffff" : obj.fill}
                disabled={obj.locked}
                onChange={(e) => onUpdate(obj.id, { fill: e.target.value })}
                className="w-8 h-8 rounded border border-border cursor-pointer disabled:opacity-50"
              />
              <Input
                type="text"
                value={obj.fill}
                disabled={obj.locked}
                onChange={(e) => onUpdate(obj.id, { fill: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Épaisseur de trait</Label>
            <Slider
              min={1}
              max={20}
              value={[obj.strokeWidth]}
              disabled={obj.locked}
              onValueChange={(value) => onUpdate(obj.id, { strokeWidth: Array.isArray(value) ? value[0] : value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Opacité</Label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[obj.opacity]}
              disabled={obj.locked}
              onValueChange={(value) => onUpdate(obj.id, { opacity: Array.isArray(value) ? value[0] : value })}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Label className="text-xs text-muted-foreground">Verrouillé</Label>
            <Switch
              checked={obj.locked}
              onCheckedChange={(checked) => onUpdate(obj.id, { locked: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
