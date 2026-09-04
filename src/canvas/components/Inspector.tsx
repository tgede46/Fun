import type { FunObject, UmlClassObject, UmlPackageObject, UmlNoteObject } from "../types";
import { displayObjectLabel } from "../utils/object-label";

interface InspectorProps {
  selectedObjects: FunObject[];
  onUpdate: (id: string, patch: Partial<FunObject>) => void;
}

export function Inspector({ selectedObjects, onUpdate }: InspectorProps) {
  if (selectedObjects.length === 0) {
    return (
      <div className="absolute right-3 top-3 w-64 bg-card border border-border rounded-lg p-3 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Sélectionnez un objet pour modifier ses propriétés
        </p>
      </div>
    );
  }

  if (selectedObjects.length > 1) {
    return (
      <div className="absolute right-3 top-3 w-64 bg-card border border-border rounded-lg p-3 shadow-sm">
        <p className="text-sm text-muted-foreground">
          {selectedObjects.length} objets sélectionnés
        </p>
      </div>
    );
  }

  const obj = selectedObjects[0];
  const lockId = `locked-${obj.id}`;

  return (
    <div className="absolute right-3 top-3 w-64 bg-card border border-border rounded-lg p-3 shadow-sm max-h-[80vh] overflow-y-auto">
      <h3 className="text-sm font-medium mb-3">Propriétés</h3>

      <div className="space-y-2">
        <div>
          <label className="text-xs text-muted-foreground" htmlFor={`label-${obj.id}`}>
            Nom du calque
          </label>
          <input
            id={`label-${obj.id}`}
            type="text"
            value={obj.label ?? displayObjectLabel(obj)}
            onChange={(e) => onUpdate(obj.id, { label: e.target.value })}
            className="mt-1 w-full px-2 py-1 text-sm border border-border rounded bg-background"
          />
        </div>

        {obj.type === "uml-class" && (
          <UmlClassFields obj={obj} onUpdate={onUpdate} />
        )}

        {obj.type === "uml-package" && (
          <UmlPackageFields obj={obj} onUpdate={onUpdate} />
        )}

        {obj.type === "uml-note" && (
          <UmlNoteFields obj={obj} onUpdate={onUpdate} />
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">X</label>
            <input
              type="number"
              value={Math.round(obj.x)}
              disabled={obj.locked}
              onChange={(e) => onUpdate(obj.id, { x: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Y</label>
            <input
              type="number"
              value={Math.round(obj.y)}
              disabled={obj.locked}
              onChange={(e) => onUpdate(obj.id, { y: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Largeur</label>
            <input
              type="number"
              value={Math.round(obj.width)}
              disabled={obj.locked}
              onChange={(e) => onUpdate(obj.id, { width: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Hauteur</label>
            <input
              type="number"
              value={Math.round(obj.height)}
              disabled={obj.locked}
              onChange={(e) => onUpdate(obj.id, { height: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm border border-border rounded bg-background disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Couleur de bordure</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={obj.stroke}
              disabled={obj.locked}
              onChange={(e) => onUpdate(obj.id, { stroke: e.target.value })}
              className="w-8 h-8 rounded border border-border cursor-pointer disabled:opacity-50"
            />
            <input
              type="text"
              value={obj.stroke}
              disabled={obj.locked}
              onChange={(e) => onUpdate(obj.id, { stroke: e.target.value })}
              className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Couleur de remplissage</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={obj.fill === "transparent" ? "#ffffff" : obj.fill}
              disabled={obj.locked}
              onChange={(e) => onUpdate(obj.id, { fill: e.target.value })}
              className="w-8 h-8 rounded border border-border cursor-pointer disabled:opacity-50"
            />
            <input
              type="text"
              value={obj.fill}
              disabled={obj.locked}
              onChange={(e) => onUpdate(obj.id, { fill: e.target.value })}
              className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background disabled:opacity-50"
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
            disabled={obj.locked}
            onChange={(e) => onUpdate(obj.id, { strokeWidth: Number(e.target.value) })}
            className="w-full disabled:opacity-50"
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
            disabled={obj.locked}
            onChange={(e) => onUpdate(obj.id, { opacity: Number(e.target.value) })}
            className="w-full disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <label className="text-xs text-muted-foreground" htmlFor={lockId}>
            Verrouillé
          </label>
          <button
            id={lockId}
            type="button"
            className={`rounded px-2 py-1 text-xs ${
              obj.locked
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={obj.locked}
            onClick={() => onUpdate(obj.id, { locked: !obj.locked })}
          >
            {obj.locked ? "🔒 Verrouillé" : "🔓 Modifiable"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UmlClassFields({
  obj,
  onUpdate,
}: {
  obj: UmlClassObject;
  onUpdate: (id: string, patch: Partial<FunObject>) => void;
}) {
  const handleAttributesChange = (value: string) => {
    const lines = value.split("\n").filter((l) => l.trim());
    onUpdate(obj.id, { attributes: lines } as Partial<FunObject>);
  };

  const handleMethodsChange = (value: string) => {
    const lines = value.split("\n").filter((l) => l.trim());
    onUpdate(obj.id, { methods: lines } as Partial<FunObject>);
  };

  return (
    <>
      <div>
        <label className="text-xs text-muted-foreground">Nom de la classe</label>
        <input
          type="text"
          value={obj.className}
          onChange={(e) => onUpdate(obj.id, { className: e.target.value } as Partial<FunObject>)}
          className="mt-1 w-full px-2 py-1 text-sm border border-border rounded bg-background"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Stereotype</label>
        <input
          type="text"
          value={obj.stereotype ?? ""}
          placeholder="ex: interface, abstract"
          onChange={(e) => onUpdate(obj.id, { stereotype: e.target.value || undefined } as Partial<FunObject>)}
          className="mt-1 w-full px-2 py-1 text-sm border border-border rounded bg-background"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">
          Attributs <span className="text-muted-foreground/60">(1 par ligne)</span>
        </label>
        <textarea
          value={obj.attributes.join("\n")}
          onChange={(e) => handleAttributesChange(e.target.value)}
          rows={3}
          className="mt-1 w-full px-2 py-1 text-sm border border-border rounded bg-background font-mono"
          placeholder="- nom: String&#10;- age: int"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">
          Methodes <span className="text-muted-foreground/60">(1 par ligne)</span>
        </label>
        <textarea
          value={obj.methods.join("\n")}
          onChange={(e) => handleMethodsChange(e.target.value)}
          rows={3}
          className="mt-1 w-full px-2 py-1 text-sm border border-border rounded bg-background font-mono"
          placeholder="+ getNom(): String&#10;+ setAge(age: int): void"
        />
      </div>
    </>
  );
}

function UmlPackageFields({
  obj,
  onUpdate,
}: {
  obj: UmlPackageObject;
  onUpdate: (id: string, patch: Partial<FunObject>) => void;
}) {
  return (
    <>
      <div>
        <label className="text-xs text-muted-foreground">Nom du package</label>
        <input
          type="text"
          value={obj.packageName}
          onChange={(e) => onUpdate(obj.id, { packageName: e.target.value } as Partial<FunObject>)}
          className="mt-1 w-full px-2 py-1 text-sm border border-border rounded bg-background"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Stereotype</label>
        <input
          type="text"
          value={obj.stereotype ?? ""}
          placeholder="ex: model, view, controller"
          onChange={(e) => onUpdate(obj.id, { stereotype: e.target.value || undefined } as Partial<FunObject>)}
          className="mt-1 w-full px-2 py-1 text-sm border border-border rounded bg-background"
        />
      </div>
    </>
  );
}

function UmlNoteFields({
  obj,
  onUpdate,
}: {
  obj: UmlNoteObject;
  onUpdate: (id: string, patch: Partial<FunObject>) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">Texte de la note</label>
      <textarea
        value={obj.text}
        onChange={(e) => onUpdate(obj.id, { text: e.target.value } as Partial<FunObject>)}
        rows={4}
        className="mt-1 w-full px-2 py-1 text-sm border border-border rounded bg-background"
      />
    </div>
  );
}
