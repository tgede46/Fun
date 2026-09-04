export const GRID_SIZE = 20;
export const DEFAULT_FILL = "transparent";
export const DEFAULT_STROKE = "#1e1e1e";
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_FONT_SIZE = 20;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BaseObject {
  id: string;
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
  /** Nom affiché dans le panneau Calques. */
  label?: string;
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

export interface ArrowObject extends BaseObject {
  type: "arrow";
  points: { x: number; y: number }[];
  arrowHead: "triangle" | "circle" | "diamond";
}

export interface ImageObject extends BaseObject {
  type: "image";
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}

export interface UmlClassObject extends BaseObject {
  type: "uml-class";
  className: string;
  stereotype?: string;
  attributes: string[];
  methods: string[];
  compartmentDivider: number;
}

export interface UmlPackageObject extends BaseObject {
  type: "uml-package";
  packageName: string;
  stereotype?: string;
}

export interface UmlNoteObject extends BaseObject {
  type: "uml-note";
  text: string;
}

export type FunObject = FreehandPath | ShapeRect | ShapeEllipse | ShapeDiamond | TextObject | ArrowObject | ImageObject | Mesh3DObject | UmlClassObject | UmlPackageObject | UmlNoteObject;

export type ToolType = "select" | "freehand" | "rect" | "ellipse" | "diamond" | "text" | "arrow" | "image" | "3d" | "uml-class" | "uml-package" | "uml-note";

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
  material: Material3D;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  extrudeShape?: { points: { x: number; y: number }[]; depth?: number };
}

export interface FunScene {
  id?: string;
  objects: FunObject[];
  camera?: Camera;
  grid?: boolean;
  version?: number;
}