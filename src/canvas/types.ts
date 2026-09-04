export const GRID_SIZE = 20;
export const DEFAULT_FILL = "transparent";
export const DEFAULT_STROKE = "#1e1e1e";
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_FONT_SIZE = 20;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;
export const DEFAULT_ARROW_HEAD = "triangle";

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
  label?: string;
}

// ─── Formes de base ───
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

// ─── Flèches / connecteurs de base ───
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

// ─── Formes UML ───
export interface UMLClassObject extends BaseObject {
  type: "uml-class";
  name: string;
  stereotype?: string;
  attributes: string[];
  methods: string[];
  compartmentsVisible: boolean;
  fontSize?: number;
}

export interface UMLInterfaceObject extends BaseObject {
  type: "uml-interface";
  name: string;
  stereotype?: string;
  attributes: string[];
  methods: string[];
  fontSize?: number;
}

export interface UMLAbstractClassObject extends BaseObject {
  type: "uml-abstract-class";
  name: string;
  stereotype?: string;
  attributes: string[];
  methods: string[];
  fontSize?: number;
}

export interface UMLEnumObject extends BaseObject {
  type: "uml-enum";
  name: string;
  values: string[];
  fontSize?: number;
}

export interface UMLActorObject extends BaseObject {
  type: "uml-actor";
  name: string;
  fontSize?: number;
}

export interface UMLUseCaseObject extends BaseObject {
  type: "uml-usecase";
  name: string;
  fontSize?: number;
}

export interface UMLStateObject extends BaseObject {
  type: "uml-state";
  name: string;
  stereotype?: string;
  fontSize?: number;
}

export interface UMLTransitionObject extends BaseObject {
  type: "uml-transition";
  name?: string;
  points: { x: number; y: number }[];
}

export interface UMLComponentObject extends BaseObject {
  type: "uml-component";
  name: string;
  stereotype?: string;
  fontSize?: number;
}

export interface UMLNodeObject extends BaseObject {
  type: "uml-node";
  name: string;
  fontSize?: number;
}

export interface UMLDatabaseObject extends BaseObject {
  type: "uml-database";
  name: string;
  fontSize?: number;
}

export interface UMLPackageObject extends BaseObject {
  type: "uml-package";
  name: string;
  fontSize?: number;
}

export interface UMLNoteObject extends BaseObject {
  type: "uml-note";
  text: string;
  fontSize?: number;
}

export interface UMLBoundaryObject extends BaseObject {
  type: "uml-boundary";
  name: string;
  fontSize?: number;
}

// ─── Connecteurs UML ───
export interface UMLAssociationObject extends BaseObject {
  type: "uml-association";
  points: { x: number; y: number }[];
  startArrow?: "none" | "triangle" | "diamond" | "fill-diamond" | "circle";
  endArrow?: "none" | "triangle" | "diamond" | "fill-diamond" | "circle";
  startID?: string;
  endID?: string;
}

export interface UMLInheritanceObject extends BaseObject {
  type: "uml-inheritance";
  points: { x: number; y: number }[];
  startID?: string;
  endID?: string;
}

export interface UMLImplementationObject extends BaseObject {
  type: "uml-implementation";
  points: { x: number; y: number }[];
  startID?: string;
  endID?: string;
}

export interface UMLAggregationObject extends BaseObject {
  type: "uml-aggregation";
  points: { x: number; y: number }[];
  startID?: string;
  endID?: string;
}

export interface UMLCompositionObject extends BaseObject {
  type: "uml-composition";
  points: { x: number; y: number }[];
  startID?: string;
  endID?: string;
}

export interface UMLDependencyObject extends BaseObject {
  type: "uml-dependency";
  points: { x: number; y: number }[];
  startID?: string;
  endID?: string;
}

export interface UMLNotesLinkObject extends BaseObject {
  type: "uml-notes-link";
  points: { x: number; y: number }[];
  startID?: string;
  endID?: string;
}

// ─── Types unifiés ───
export type UMLObjectType =
  | "uml-class"
  | "uml-interface"
  | "uml-abstract-class"
  | "uml-enum"
  | "uml-actor"
  | "uml-usecase"
  | "uml-state"
  | "uml-transition"
  | "uml-component"
  | "uml-node"
  | "uml-database"
  | "uml-package"
  | "uml-note"
  | "uml-boundary";

export type UMLConnectorType =
  | "uml-association"
  | "uml-inheritance"
  | "uml-implementation"
  | "uml-aggregation"
  | "uml-composition"
  | "uml-dependency"
  | "uml-notes-link";

export type UMLShapeType = UMLObjectType | UMLConnectorType;

export type FunObject =
  | FreehandPath
  | ShapeRect
  | ShapeEllipse
  | ShapeDiamond
  | TextObject
  | ArrowObject
  | ImageObject
  | UMLClassObject
  | UMLInterfaceObject
  | UMLAbstractClassObject
  | UMLEnumObject
  | UMLActorObject
  | UMLUseCaseObject
  | UMLStateObject
  | UMLTransitionObject
  | UMLComponentObject
  | UMLNodeObject
  | UMLDatabaseObject
  | UMLPackageObject
  | UMLNoteObject
  | UMLBoundaryObject
  | UMLAssociationObject
  | UMLInheritanceObject
  | UMLImplementationObject
  | UMLAggregationObject
  | UMLCompositionObject
  | UMLDependencyObject
  | UMLNotesLinkObject;

export type ToolType =
  | "select"
  | "freehand"
  | "rect"
  | "ellipse"
  | "diamond"
  | "text"
  | "arrow"
  | "image"
  | "uml-class"
  | "uml-interface"
  | "uml-abstract-class"
  | "uml-enum"
  | "uml-actor"
  | "uml-usecase"
  | "uml-state"
  | "uml-component"
  | "uml-node"
  | "uml-database"
  | "uml-package"
  | "uml-note"
  | "uml-boundary"
  | "uml-association"
  | "uml-inheritance"
  | "uml-implementation"
  | "uml-aggregation"
  | "uml-composition"
  | "uml-dependency"
  | "uml-notes-link";

export interface FunScene {
  id?: string;
  objects: FunObject[];
  camera?: Camera;
  grid?: boolean;
  version?: number;
}
