import { invoke } from "@tauri-apps/api/core";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import type { FunScene } from "@/canvas/types";
import {
  parseExcalidrawContent,
  prepareExcalidrawScene,
} from "@/lib/excalidraw-sanitize";

export type DiagramKind = "sketch" | "drawio" | "plantuml";

export type CreateDiagramResult = {
  path: string;
  name: string;
  is_drawio?: boolean;
};

export type LoadDiagramResult = {
  path: string;
  content: string;
};

export type DiagramListItem = {
  path: string;
  name: string;
  kind?: DiagramKind;
};

export type { ExcalidrawInitialDataState };
export { parseExcalidrawContent, prepareExcalidrawScene };

export async function createDiagram(
  projectPath: string,
): Promise<CreateDiagramResult> {
  return invoke<CreateDiagramResult>("create_diagram", { projectPath });
}

export async function createDrawioDiagram(
  projectPath: string,
): Promise<CreateDiagramResult> {
  return invoke<CreateDiagramResult>("create_drawio_diagram", { projectPath });
}

export async function createDiagramOfKind(
  projectPath: string,
  kind: DiagramKind,
): Promise<CreateDiagramResult> {
  return invoke<CreateDiagramResult>("create_diagram_of_kind", {
    projectPath,
    kind,
  });
}

export async function createDiagramWithContent(
  projectPath: string,
  kind: DiagramKind,
  content: string,
): Promise<CreateDiagramResult> {
  return invoke<CreateDiagramResult>("create_diagram_with_content", {
    projectPath,
    kind,
    content,
  });
}

export async function loadDiagram(
  projectPath: string,
  diagramPath: string,
): Promise<LoadDiagramResult> {
  return invoke<LoadDiagramResult>("load_diagram", {
    projectPath,
    diagramPath,
  });
}

export async function loadDrawioDiagram(
  projectPath: string,
  diagramPath: string,
): Promise<LoadDiagramResult> {
  return invoke<LoadDiagramResult>("load_drawio_diagram", {
    projectPath,
    diagramPath,
  });
}

export async function saveDiagram(
  projectPath: string,
  diagramPath: string,
  content: string,
): Promise<void> {
  await invoke("save_diagram", {
    projectPath,
    diagramPath,
    content,
  });
}

export async function saveDrawioDiagram(
  projectPath: string,
  diagramPath: string,
  content: string,
): Promise<void> {
  await invoke("save_drawio_diagram", {
    projectPath,
    diagramPath,
    content,
  });
}

export async function listDiagrams(
  projectPath: string,
): Promise<DiagramListItem[]> {
  return invoke<DiagramListItem[]>("list_diagrams", { projectPath });
}

export async function deleteDiagram(
  projectPath: string,
  diagramPath: string,
): Promise<void> {
  await invoke("delete_diagram", { projectPath, diagramPath });
}

export async function createAndLoadDiagram(
  projectPath: string,
): Promise<{
  path: string;
  name: string;
  initialData: ExcalidrawInitialDataState;
  rawContent: string;
}> {
  const created = await createDiagram(projectPath);
  const loaded = await loadDiagram(projectPath, created.path);

  return {
    path: loaded.path,
    name: created.name,
    initialData: await parseExcalidrawContent(loaded.content),
    rawContent: loaded.content,
  };
}

export async function loadDiagramIntoCanvas(
  projectPath: string,
  diagramPath: string,
): Promise<{
  path: string;
  name: string;
  initialData: ExcalidrawInitialDataState;
  rawContent: string;
}> {
  const loaded = await loadDiagram(projectPath, diagramPath);
  const name =
    diagramPath.split(/[/\\]/).pop()?.replace(/\.excalidraw$/, "") ?? "diagramme";

  return {
    path: loaded.path,
    name,
    initialData: await parseExcalidrawContent(loaded.content),
    rawContent: loaded.content,
  };
}

export function serializeFunScene(scene: FunScene): string {
  const excalidrawElements = scene.objects.map((obj) => {
    const base = {
      id: obj.id,
      type: obj.type === "freehand" ? "freedraw" : obj.type,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      strokeColor: obj.stroke,
      backgroundColor: obj.fill,
      strokeWidth: obj.strokeWidth,
      opacity: obj.opacity,
      locked: obj.locked,
    };

    if (obj.type === "freehand") {
      return {
        ...base,
        type: "freedraw",
        points: obj.points.map((p) => ({ x: p.x, y: p.y })),
      };
    }

    if (obj.type === "text") {
      return {
        ...base,
        type: "text",
        text: obj.text,
        fontSize: obj.fontSize,
      };
    }

    if (obj.type === "arrow") {
      return {
        ...base,
        type: "arrow",
        points: obj.points.map((p) => ({ x: p.x, y: p.y })),
      };
    }

    return base;
  });

  const edges = (scene.edges ?? []).map((edge) => ({
    id: edge.id,
    type: "edge" as const,
    fromId: edge.fromId,
    toId: edge.toId,
    kind: edge.kind,
    label: edge.label,
    stroke: edge.stroke,
    strokeWidth: edge.strokeWidth,
    points: edge.points,
  }));

  const result = {
    type: "excalidraw" as const,
    version: 2 as const,
    elements: excalidrawElements,
    edges,
    appState: {
      viewBackgroundColor: "#ffffff",
    },
    files: {},
  };

  return JSON.stringify(result, null, 2);
}

export async function deserializeFunScene(rawContent: string): Promise<FunScene> {
  const { sceneFromContent } = await import("@/lib/diagram-convert");
  const scene = sceneFromContent("sketch", rawContent);
  return {
    id: crypto.randomUUID(),
    objects: scene.objects,
    edges: scene.edges ?? [],
    camera: scene.camera ?? { x: 0, y: 0, zoom: 1 },
    grid: true,
    version: 1,
    metadata: scene.metadata,
  };
}
