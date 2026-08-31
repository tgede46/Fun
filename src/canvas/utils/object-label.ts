import type { FunObject, TextObject } from "../types";

const TYPE_LABELS: Record<string, string> = {
  rect: "Rectangle",
  ellipse: "Ellipse",
  diamond: "Losange",
  freehand: "Trait",
  text: "Texte",
  arrow: "Flèche",
  image: "Image",
  mesh3d: "Objet 3D",
};

export function defaultObjectLabel(type: string, objects: FunObject[]): string {
  const base = TYPE_LABELS[type] ?? type;
  const count = objects.filter((o) => o.type === type).length;
  return `${base} ${count + 1}`;
}

export function displayObjectLabel(obj: FunObject): string {
  if (obj.label?.trim()) {
    return obj.label.trim();
  }
  if (obj.type === "text") {
    const text = (obj as TextObject).text?.trim();
    if (text) {
      return text.length > 24 ? `${text.slice(0, 24)}…` : text;
    }
  }
  return TYPE_LABELS[obj.type] ?? obj.type;
}
