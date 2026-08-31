export interface FunScene {
  id: string;
  objects: FunObject[];
  camera: Camera;
  grid: boolean;
  version: 1;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface BaseObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  locked: boolean;
  zIndex: number;
}

export interface FreehandPath extends BaseObject {
  type: "freehand";
  points: { x: number; y: number }[];
}

export interface ShapeRect extends BaseObject {
  type: "rect";
  borderRadius: number;
}

export interface ShapeEllipse extends BaseObject {
  type: "ellipse";
}

export interface ShapeDiamond extends BaseObject {
  type: "diamond";
}

export interface TextObject extends BaseObject {
  type: "text";
  text: string;
  fontSize: number;
}

export type FunObject = FreehandPath | ShapeRect | ShapeEllipse | ShapeDiamond | TextObject | Mesh3DObject;

export type ToolType = "select" | "freehand" | "rect" | "ellipse" | "diamond" | "text" | "3d";

export type Mesh3DGeometry = "box" | "sphere" | "cylinder" | "cone" | "torus" | "extrude";

export interface Material3D {
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  wireframe: boolean;
}

export interface Mesh3DObject extends BaseObject {
  type: "mesh3d";
  geometry: Mesh3DGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  material: Material3D;
  extrudeShape?: { points: { x: number; y: number }[]; depth: number };
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeHandle =
  | "nw" | "n" | "ne"
  | "e"
  | "se" | "s" | "sw"
  | "w";

export const DEFAULT_FILL = "transparent";
export const DEFAULT_STROKE = "#1a1a1a";
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_FONT_SIZE = 20;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;
export const GRID_SIZE = 20;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
