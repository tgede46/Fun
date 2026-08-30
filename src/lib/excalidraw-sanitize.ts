"use client";

import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

const LINEAR_TYPES = new Set(["arrow", "line", "draw", "freedraw"]);

/** Alias IA → types Excalidraw officiels. */
const TYPE_ALIASES: Record<string, string> = {
  circle: "ellipse",
  oval: "ellipse",
  box: "rectangle",
  rect: "rectangle",
  square: "rectangle",
  rhombus: "diamond",
  lozenge: "diamond",
  freeline: "line",
  path: "line",
};

const ALLOWED_TYPES = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "arrow",
  "line",
  "freedraw",
  "draw",
  "text",
  "image",
  "frame",
  "magicframe",
  "embeddable",
  "iframe",
]);

function normalizeType(type: string): string | null {
  const mapped = TYPE_ALIASES[type.toLowerCase()] ?? type.toLowerCase();
  if (!ALLOWED_TYPES.has(mapped)) {
    return null;
  }
  return mapped;
}

function sanitizeRawElement(
  raw: Record<string, unknown>,
): Record<string, unknown> | null {
  if (typeof raw.type !== "string" || raw.type.length === 0) {
    return null;
  }

  const type = normalizeType(raw.type);
  if (!type) {
    return null;
  }

  const id = typeof raw.id === "string" && raw.id ? raw.id : crypto.randomUUID();
  const x = typeof raw.x === "number" ? raw.x : 0;
  const y = typeof raw.y === "number" ? raw.y : 0;
  const width = typeof raw.width === "number" ? raw.width : 160;
  const height = typeof raw.height === "number" ? raw.height : 80;

  const element: Record<string, unknown> = {
    ...raw,
    id,
    type,
    x,
    y,
    width,
    height,
  };

  if (LINEAR_TYPES.has(type)) {
    const points = raw.points;
    if (!Array.isArray(points) || points.length < 2) {
      element.points = [
        [0, 0],
        [Math.max(width, 80), 0],
      ];
    }
  }

  if (type === "text" && typeof raw.text !== "string") {
    element.text = "Texte";
    element.fontSize = typeof raw.fontSize === "number" ? raw.fontSize : 20;
  }

  if (type === "rectangle" || type === "diamond" || type === "ellipse") {
    element.label = raw.label ?? {
      text: typeof raw.text === "string" ? raw.text : "",
    };
  }

  return element;
}

function prepRawElements(elements: unknown): Record<string, unknown>[] {
  if (!Array.isArray(elements)) {
    return [];
  }

  return elements
    .filter((el): el is Record<string, unknown> => !!el && typeof el === "object")
    .map(sanitizeRawElement)
    .filter((el): el is Record<string, unknown> => el !== null);
}

type ParsedExcalidrawFile = {
  elements?: unknown;
  appState?: ExcalidrawInitialDataState["appState"];
  app_state?: ExcalidrawInitialDataState["appState"];
  files?: ExcalidrawInitialDataState["files"];
};

/** Normalise un JSON Excalidraw (souvent incomplet quand généré par l'IA) pour Excalidraw. */
export async function parseExcalidrawContent(
  content: string,
): Promise<ExcalidrawInitialDataState> {
  const { convertToExcalidrawElements, restore } = await import("@excalidraw/excalidraw");

  let parsed: ParsedExcalidrawFile;

  try {
    parsed = JSON.parse(content) as ParsedExcalidrawFile;
  } catch {
    throw new Error("Le fichier diagramme est illisible.");
  }

  const appState = parsed.appState ?? parsed.app_state ?? {};
  const files = parsed.files ?? {};
  const rawElements = prepRawElements(parsed.elements);

  if (rawElements.length === 0) {
    return { elements: [], appState, files };
  }

  try {
    let elements;
    try {
      elements = convertToExcalidrawElements(
        rawElements as Parameters<typeof convertToExcalidrawElements>[0],
        { regenerateIds: true },
      );
    } catch {
      const restored = restore(
        {
          elements: rawElements as unknown as NonNullable<
            Parameters<typeof restore>[0]
          >["elements"],
          appState: {},
          files: {},
        },
        null,
        null,
        { repairBindings: true, refreshDimensions: true },
      );
      elements = restored.elements;
    }

    const restored = restore({ elements, appState, files }, null, null, {
      repairBindings: true,
      refreshDimensions: true,
    });

    return {
      elements: restored.elements,
      appState: restored.appState,
      files: restored.files,
    };
  } catch {
    return {
      elements: [],
      appState,
      files,
    };
  }
}

/** Sérialise une scène sanitizée (pour persister après mise à jour IA). */
export async function serializeExcalidrawScene(
  initialData: ExcalidrawInitialDataState,
): Promise<string> {
  const { serializeAsJSON } = await import("@excalidraw/excalidraw");
  return serializeAsJSON(
    initialData.elements ?? [],
    initialData.appState ?? {},
    initialData.files ?? {},
    "local",
  );
}

/** Parse + sérialise — JSON sûr pour disque et canvas. */
export async function prepareExcalidrawScene(content: string): Promise<{
  initialData: ExcalidrawInitialDataState;
  sanitizedJson: string;
}> {
  const initialData = await parseExcalidrawContent(content);
  const sanitizedJson = await serializeExcalidrawScene(initialData);
  return { initialData, sanitizedJson };
}
