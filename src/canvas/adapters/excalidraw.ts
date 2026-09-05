import type {
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { FunObject, FunScene, DiagramMetadata, BaseObject } from "../types";

// Interface locale — ExcalidrawElement n'est pas exporté depuis @excalidraw/excalidraw/types
interface ExcalidrawElementLike {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  locked: boolean;
  type: string;
  isDeleted?: boolean;
  points?: number[][];
  text?: string;
  fontSize?: number;
  src?: string;
  groupIds?: string[];
  startBinding?: null | { elementId: string; boundElementSide: string };
  endBinding?: null | { elementId: string; boundElementSide: string };
  startArrowhead?: string | null;
  endArrowhead?: string | null;
  autoResize?: boolean;
  containerId?: string | null;
  originalText?: string;
  textAlign?: string;
  verticalAlign?: string;
  fontFamily?: number;
  lineHeight?: number;
  crop?: null;
  fileId?: null;
  [key: string]: unknown;
}

function pointsToXYArray(points: number[][]): { x: number; y: number }[] {
  return points.map((p) => ({ x: p[0], y: p[1] }));
}

function xyArrayToPoints(xy: { x: number; y: number }[]): number[][] {
  return xy.map((p) => [p.x, p.y]);
}

// ─── Excalidraw → Fun ───

function excalidrawElementToFunObject(
  el: ExcalidrawElementLike,
  idMap?: Map<string, string>
): FunObject | null {
  if (el.isDeleted) return null;
  if (el.groupIds && el.groupIds.length > 0) return null;

  const base: BaseObject = {
    id: idMap?.get(el.id) ?? el.id,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    fill: el.backgroundColor ?? "transparent",
    stroke: el.strokeColor ?? "#1a1a1a",
    strokeWidth: el.strokeWidth ?? 2,
    opacity: (el.opacity ?? 100) / 100,
    locked: el.locked ?? false,
    zIndex: 0,
  };

  switch (el.type) {
    case "rectangle":
      return {
        ...base,
        type: "rect",
        borderRadius: 0,
      };
    case "ellipse":
      return {
        ...base,
        type: "ellipse",
      };
    case "diamond":
      return {
        ...base,
        type: "diamond",
      };
    case "text":
      return {
        ...base,
        type: "text",
        text: el.text ?? "",
        fontSize: el.fontSize ?? 20,
      };
    case "freedraw":
      return {
        ...base,
        type: "freehand",
        points: pointsToXYArray(el.points ?? []),
      };
    case "arrow":
      return {
        ...base,
        type: "arrow",
        points: pointsToXYArray(el.points ?? []),
        arrowHead: "triangle",
      };
    case "line":
      return {
        ...base,
        type: "freehand",
        points: pointsToXYArray(el.points ?? []),
      };
    case "image":
      return {
        ...base,
        type: "image",
        src: el.src ?? "",
        naturalWidth: el.width,
        naturalHeight: el.height,
      };
    default:
      return null;
  }
}

export function excalidrawToFunScene(
  elements: readonly ExcalidrawElementLike[],
  metadata?: DiagramMetadata
): FunScene {
  const objects: FunObject[] = [];

  for (const el of elements) {
    const obj = excalidrawElementToFunObject(el);
    if (obj) objects.push(obj);
  }

  return {
    objects,
    metadata: metadata ?? { sourceFormat: "excalidraw" },
  };
}

// ─── Fun → Excalidraw ───

const TYPE_MAP: Record<string, string> = {
  rect: "rectangle",
  ellipse: "ellipse",
  diamond: "diamond",
  text: "text",
  freehand: "freedraw",
  arrow: "arrow",
  image: "image",
};

function funObjectToExcalidrawElement(obj: FunObject): ExcalidrawElementLike | null {
  const base = {
    id: obj.id,
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
    strokeColor: obj.stroke,
    backgroundColor: obj.fill,
    strokeWidth: obj.strokeWidth,
    opacity: obj.opacity * 100,
    locked: obj.locked,
  };

  switch (obj.type) {
    case "freehand":
      return {
        ...base,
        type: "freedraw",
        points: xyArrayToPoints((obj as { points: { x: number; y: number }[] }).points),
      };
    case "text":
      return {
        ...base,
        type: "text",
        text: (obj as { text: string }).text,
        fontSize: (obj as { fontSize: number }).fontSize,
        textAlign: "left",
        verticalAlign: "top",
        fontFamily: 1,
        lineHeight: 1.25,
        containerId: null,
        originalText: (obj as { text: string }).text,
        autoResize: true,
      };
    case "arrow":
      return {
        ...base,
        type: "arrow",
        points: xyArrayToPoints((obj as { points: { x: number; y: number }[] }).points),
        startBinding: null,
        endBinding: null,
        startArrowhead: null,
        endArrowhead: "triangle",
      };
    case "image":
      return {
        ...base,
        type: "image",
        src: (obj as { src: string }).src,
        fileId: null,
        crop: null,
      };
    case "rect":
    case "ellipse":
    case "diamond":
      return {
        ...base,
        type: TYPE_MAP[obj.type] as "rectangle" | "ellipse" | "diamond",
      };
    default:
      return null;
  }
}

export function funSceneToExcalidrawData(
  scene: FunScene,
  options?: { preserveUnknownFields?: boolean }
): ExcalidrawInitialDataState {
  const objects = scene.objects;

  if (objects.length === 0) {
    return { elements: [], appState: {}, files: {} };
  }

  const excalidrawElements: ExcalidrawElementLike[] = [];

  for (const obj of objects) {
    const el = funObjectToExcalidrawElement(obj);
    if (el) excalidrawElements.push(el);
  }

  return {
    elements: excalidrawElements as any,
    appState: {
      viewBackgroundColor: "#ffffff",
    },
    files: {},
  };
}
