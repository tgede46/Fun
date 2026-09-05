import type { BBox, FunObject } from "../types";

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function objectBBox(obj: FunObject): BBox {
  if (obj.type === "freehand") {
    const pts = obj.points;
    if (pts.length === 0) return { x: obj.x, y: obj.y, width: 0, height: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
}

export function bboxesOverlap(a: BBox, b: BBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function pointInBBox(px: number, py: number, box: BBox): boolean {
  return px >= box.x && px <= box.x + box.width && py >= box.y && py <= box.y + box.height;
}

export function pointInRect(px: number, py: number, obj: FunObject & { type: "rect" }): boolean {
  return pointInBBox(px, py, { x: obj.x, y: obj.y, width: obj.width, height: obj.height });
}

export function pointInEllipse(px: number, py: number, obj: FunObject & { type: "ellipse" }): boolean {
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  const rx = obj.width / 2;
  const ry = obj.height / 2;
  if (rx === 0 || ry === 0) return false;
  return ((px - cx) ** 2) / (rx ** 2) + ((py - cy) ** 2) / (ry ** 2) <= 1;
}

export function pointInDiamond(px: number, py: number, obj: FunObject & { type: "diamond" }): boolean {
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  const hw = obj.width / 2;
  const hh = obj.height / 2;
  if (hw === 0 || hh === 0) return false;
  return Math.abs(px - cx) / hw + Math.abs(py - cy) / hh <= 1;
}

export function pointInObject(px: number, py: number, obj: FunObject): boolean {
  switch (obj.type) {
    case "rect":
      return pointInRect(px, py, obj);
    case "ellipse":
      return pointInEllipse(px, py, obj);
    case "diamond":
      return pointInDiamond(px, py, obj);
    case "text":
      return pointInBBox(px, py, { x: obj.x, y: obj.y, width: obj.width, height: obj.height });
    case "freehand": {
      const threshold = 8;
      for (const pt of obj.points) {
        if (distance({ x: px, y: py }, pt) < threshold) return true;
      }
      return false;
    }
    default:
      return pointInBBox(px, py, { x: obj.x, y: obj.y, width: obj.width, height: obj.height });
  }
}

export function pointNearEdge(
  px: number,
  py: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  threshold: number = 8,
): boolean {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance({ x: px, y: py }, { x: fromX, y: fromY }) < threshold;
  let t = ((px - fromX) * dx + (py - fromY) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = fromX + t * dx;
  const projY = fromY + t * dy;
  return distance({ x: px, y: py }, { x: projX, y: projY }) < threshold;
}

export function resizeBBox(
  bbox: BBox,
  handle: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w",
  dx: number,
  dy: number,
): BBox {
  let { x, y, width, height } = bbox;
  if (handle.includes("w")) { x += dx; width -= dx; }
  if (handle.includes("e") || handle === "e") { width += dx; }
  if (handle.includes("n") && handle !== "ne" && handle !== "nw" || handle === "n") { y += dy; height -= dy; }
  if (handle === "nw" || handle === "ne") { y += dy; height -= dy; }
  if (handle.includes("s") || handle === "s") { height += dy; }
  if (width < 10) width = 10;
  if (height < 10) height = 10;
  return { x, y, width, height };
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
