/**
 * Adaptateur draw.io (mxfile XML) → FunScene / FunScene → mxfile XML
 *
 * Draw.io stocke les diagrammes dans un format XML hiérarchique avec des cellules
 * (mxCell) qui peuvent être des nœuds ou des arêtes. Cet adaptateur fait le bidirectionnel
 * pour les cas MVP : formes de base (rectangle, ellipse, texte, image) + arêtes simples.
 *
 * Limitations MVP :
 * - Ne pas gérer les styles complets (gradients, ombres, etc.)
 * - Ne pas gérer les groupes ni les containers imbriqués au-delà du premier niveau
 * - Les coordonnées sont normalisées relativement au document, pas aux parents
 */

import type { FunObject, FunScene, EdgeObject, DiagramMetadata, BaseObject } from "../types";

// ─── Types internes pour parser le XML draw.io ───

interface MxCell {
  id: string;
  value?: string;
  vertex?: "1" | "0";
  edge?: "1" | "0";
  source?: string;
  target?: string;
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  style?: string;
  points?: string;
  [key: string]: string | undefined;
}

interface MxGraphModel {
  root?: MxCell;
  cells: MxCell[];
}

// ─── Helpers de parsing ───

function parseXmlToGraphModel(xml: string): MxGraphModel | null {
  // MVP : parsing basique avec le DOM natif du navigateur
  // Dans un contexte Node/Tauri, on pourrait utiliser @xmldom/xmldom ou xml2js
  let parser: DOMParser;
  try {
    parser = new DOMParser();
  } catch {
    return null;
  }

  const doc = parser.parseFromString(xml, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) return null;

  const root = doc.documentElement;
  if (!root) return null;

  const cells: MxCell[] = [];

  // draw.io mxfile → mxGraphModel → root + enfants
  const graphModel = root.querySelector("mxGraphModel");
  if (!graphModel) return null;

  const rootCell = graphModel.querySelector("root")?.querySelector("mxCell");
  const allCells = graphModel.querySelectorAll("mxCell");

  allCells.forEach((cell: Element) => {
    const attrMap: Record<string, string | undefined> = {};
    Array.from(cell.attributes).forEach((a: Attr) => {
      attrMap[a.name] = a.value;
    });

    cells.push({
      id: attrMap.id ?? "",
      value: attrMap.value,
      vertex: attrMap.vertex as "1" | "0" | undefined,
      edge: attrMap.edge as "1" | "0" | undefined,
      source: attrMap.source,
      target: attrMap.target,
      x: attrMap.x,
      y: attrMap.y,
      width: attrMap.width,
      height: attrMap.height,
      style: attrMap.style,
      points: attrMap.points,
    });
  });

  return { root: rootCell as unknown as MxCell, cells };
}

function extractDrawioStyle(style: string | undefined): {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  shape?: string;
} {
  if (!style) return {};

  const map: Record<string, string | number> = {};
  style.split(";").forEach((part) => {
    const [key, ...rest] = part.split("=");
    if (key && rest.length) {
      const val = rest.join("=");
      if (!isNaN(Number(val))) {
        map[key] = Number(val);
      } else {
        map[key] = val;
      }
    }
  });

  return {
    fill: map.fill as string | undefined,
    stroke: map.stroke as string | undefined,
    strokeWidth: map.strokeWidth as number | undefined,
    fontSize: map.fontSize as number | undefined,
    shape: map.shape as string | undefined,
  };
}

function drawioPointsToCoords(pointsStr: string | undefined): { x: number; y: number }[] {
  if (!pointsStr) return [];
  const parts = pointsStr.split(";").filter(Boolean);
  return parts.map((part) => {
    const [xS, yS] = part.split(",");
    const x = xS ? parseFloat(xS) : 0;
    const y = yS ? parseFloat(yS) : 0;
    return { x, y };
  });
}

// ─── draw.io → Fun ───

const SHAPE_MAP: Record<string, "rect" | "ellipse" | "diamond" | "text" | "image"> = {
  rectangle: "rect",
  "ELBOW-EDGE": "rect",
  ellipse: "ellipse",
  "//ellipse//": "ellipse",
  diamond: "diamond",
  "rhombus": "diamond",
  text: "text",
  hand: "text",
  image: "image",
};

function drawioCellToFunObject(
  cell: MxCell,
  idMap?: Map<string, string>
): FunObject | EdgeObject | null {
  const id = idMap?.get(cell.id) ?? cell.id;

  // Arête draw.io → EdgeObject
  if (cell.edge === "1") {
    const base: BaseObject = {
      id,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
    };

    const points = drawioPointsToCoords(cell.points);
    const fromId = cell.source ?? "";
    const toId = cell.target ?? "";

    // Déduire le type de connexion depuis le style
    const kind = "dependency" as const;

    return {
      ...base,
      type: "edge",
      fromId,
      toId,
      kind,
      points,
    } as EdgeObject;
  }

  // Nœud draw.io → FunObject
  if (cell.vertex === "1") {
    const x = cell.x ? parseFloat(cell.x) : 0;
    const y = cell.y ? parseFloat(cell.y) : 0;
    const width = cell.width ? parseFloat(cell.width) : 100;
    const height = cell.height ? parseFloat(cell.height) : 60;

    const styleProps = extractDrawioStyle(cell.style);
    const fill = styleProps.fill ?? "transparent";
    const stroke = styleProps.stroke ?? "#1e1e1e";
    const strokeWidth = styleProps.strokeWidth ?? 2;

    const base: BaseObject = {
      id,
      x,
      y,
      width,
      height,
      fill,
      stroke,
      strokeWidth,
      opacity: 1,
      locked: false,
      zIndex: 0,
    };

    const shape = styleProps.shape ?? "rectangle";
    const type = SHAPE_MAP[shape] ?? "rect";

    if (type === "text") {
      const text = cell.value ?? "";
      return {
        ...base,
        type: "text",
        text,
        fontSize: styleProps.fontSize ?? 14,
      };
    }

    if (type === "image") {
      return {
        ...base,
        type: "image",
        src: cell.value ?? "",
        naturalWidth: width,
        naturalHeight: height,
      };
    }

    if (type === "rect") {
      return {
        ...base,
        type: "rect",
        borderRadius: 0,
      };
    }

    if (type === "ellipse") {
      return {
        ...base,
        type: "ellipse",
      };
    }

    if (type === "diamond") {
      return {
        ...base,
        type: "diamond",
      };
    }

    return null;
  }

  return null;
}

export function drawioXmlToFunScene(
  xml: string,
  metadata?: DiagramMetadata
): FunScene {
  const model = parseXmlToGraphModel(xml);
  if (!model) {
    return {
      objects: [],
      edges: [],
      metadata: { sourceFormat: "drawio", ...metadata },
    };
  }

  const objects: FunObject[] = [];
  const edges: EdgeObject[] = [];

  // Construire la map d'IDs pour les arêtes
  const idMap = new Map<string, string>();
  model.cells.forEach((cell) => {
    if (cell.vertex === "1") {
      idMap.set(cell.id, cell.id);
    }
  });

  for (const cell of model.cells) {
    const obj = drawioCellToFunObject(cell, idMap);
    if (!obj) continue;
    if ("fromId" in obj) {
      edges.push(obj as EdgeObject);
    } else {
      objects.push(obj as FunObject);
    }
  }

  return {
    objects,
    edges,
    metadata: { sourceFormat: "drawio", ...metadata },
  };
}

// ─── Fun → draw.io ───

const FUN_SHAPE_MAP: Record<string, string> = {
  rect: "rectangle",
  ellipse: "ellipse",
  diamond: "diamond",
  text: "text",
  image: "image",
  freehand: "rectangle",
  arrow: "rectangle",
  "uml-class": "rectangle",
  "uml-interface": "rectangle",
  "uml-abstract-class": "rectangle",
  "uml-enum": "rectangle",
  "uml-component": "rectangle",
  "uml-node": "rectangle",
  "uml-database": "cylinder",
  "uml-package": "folder",
  "uml-note": "note",
  "uml-actor": "umlActor",
  "uml-usecase": "ellipse",
  "uml-state": "rectangle",
  "uml-boundary": "rectangle",
};

function umlValue(obj: FunObject): string | undefined {
  if (obj.type === "text" || obj.type === "uml-note") {
    return (obj as { text: string }).text;
  }
  if (obj.type === "image") {
    return (obj as { src: string }).src;
  }
  if ("name" in obj && typeof (obj as { name?: string }).name === "string") {
    const named = obj as {
      name: string;
      stereotype?: string;
      attributes?: string[];
      methods?: string[];
      values?: string[];
    };
    const lines = [named.name];
    if (named.stereotype) lines.unshift(`«${named.stereotype}»`);
    if (named.attributes?.length) lines.push(...named.attributes);
    if (named.methods?.length) lines.push(...named.methods);
    if (named.values?.length) lines.push(...named.values);
    return lines.join("\n");
  }
  return obj.label;
}

function funObjectToDrawioCell(obj: FunObject): MxCell {
  const x = obj.x;
  const y = obj.y;
  const width = obj.width || 100;
  const height = obj.height || 60;

  const styleBits: string[] = [];
  styleBits.push(`fillColor=${obj.fill || "none"}`);
  styleBits.push(`strokeColor=${obj.stroke || "#000000"}`);
  styleBits.push(`strokeWidth=${obj.strokeWidth || 2}`);
  if (obj.type === "text" || obj.type.startsWith("uml-")) {
    styleBits.push(`fontSize=${(obj as { fontSize?: number }).fontSize || 14}`);
    styleBits.push("whiteSpace=wrap;html=1");
  }

  const shape = FUN_SHAPE_MAP[obj.type] ?? "rectangle";
  styleBits.push(`shape=${shape}`);

  const value = umlValue(obj);

  return {
    id: obj.id,
    value,
    vertex: "1",
    edge: "0",
    x: String(x),
    y: String(y),
    width: String(width),
    height: String(height),
    style: styleBits.join(";"),
  };
}

function edgeToDrawioCell(edge: EdgeObject): MxCell {
  const pointsStr = edge.points
    ? edge.points.map((p) => `${p.x},${p.y}`).join(";")
    : "";

  let style = "endArrow=classic";
  switch (edge.kind) {
    case "inheritance":
      style = "endArrow=block;endFill=0";
      break;
    case "implementation":
      style = "endArrow=block;endFill=0;dashed=1";
      break;
    case "aggregation":
      style = "startArrow=diamond;startFill=0;endArrow=none";
      break;
    case "composition":
      style = "startArrow=diamond;startFill=1;endArrow=none";
      break;
    case "dependency":
      style = "endArrow=open;dashed=1";
      break;
    default:
      break;
  }

  return {
    id: edge.id,
    vertex: "0",
    edge: "1",
    source: edge.fromId,
    target: edge.toId,
    value: edge.label,
    style,
    points: pointsStr,
  };
}

function escapeXml(value: string | undefined): string {
  if (value === undefined) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function indent(level: number): string {
  return "  ".repeat(level);
}

export function funSceneToDrawioXml(
  scene: FunScene,
  options?: { minify?: boolean }
): string {
  const objects = scene.objects;
  const edges = scene.edges ?? [];

  const nl = options?.minify ? "" : "\n";

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>${nl}`,
    `<mxfile host="Fun">${nl}`,
    `${indent(1)}<diagram name="diagram">${nl}`,
    renderDiagramContent(objects, edges, nl, indent(2)),
    `${indent(1)}</diagram>${nl}`,
    `</mxfile>${nl}`,
  ].join("");

  return xml;
}

function renderDiagramContent(
  objects: FunObject[],
  edges: EdgeObject[],
  nl: string,
  indentStr: string
): string {
  const cells: string[] = [];

  // Tout ça va dans un mxGraphModel déguisé — pour MVP on produit une structure minimale
  cells.push(`${indentStr}<mxGraphModel>${nl}`);
  cells.push(`${indentStr}${indentStr}<root>${nl}`);
  cells.push(`${indentStr}${indentStr}${indentStr}<mxCell id="0"/>${nl}`);
  cells.push(`${indentStr}${indentStr}${indentStr}<mxCell id="1" parent="0"/>${nl}`);
  cells.push(`${indentStr}${indentStr}</root>${nl}`);

  // Nœuds
  for (const obj of objects) {
    const cell = funObjectToDrawioCell(obj);
    const attrs = [
      `id="${cell.id}"`,
      `vertex="1"`,
      `edge="0"`,
      cell.x !== undefined ? `x="${cell.x}"` : "",
      cell.y !== undefined ? `y="${cell.y}"` : "",
      cell.width !== undefined ? `width="${cell.width}"` : "",
      cell.height !== undefined ? `height="${cell.height}"` : "",
      cell.style ? `style="${cell.style}"` : "",
      cell.value !== undefined ? `value="${escapeXml(cell.value)}"` : "",
    ]
      .filter(Boolean)
      .join(" ");
    cells.push(`${indentStr}${indentStr}<mxCell ${attrs}/>${nl}`);
  }

  // Arêtes
  for (const edge of edges) {
    const cell = edgeToDrawioCell(edge);
    const attrs = [
      `id="${cell.id}"`,
      `vertex="0"`,
      `edge="1"`,
      `source="${cell.source ?? ""}"`,
      `target="${cell.target ?? ""}"`,
      cell.style ? `style="${cell.style}"` : "",
      cell.points ? `points="${cell.points}"` : "",
      cell.value !== undefined ? `value="${escapeXml(cell.value)}"` : "",
    ]
      .filter(Boolean)
      .join(" ");
    cells.push(`${indentStr}${indentStr}<mxCell ${attrs}/>${nl}`);
  }

  cells.push(`${indentStr}</mxGraphModel>${nl}`);
  return cells.join("");
}
