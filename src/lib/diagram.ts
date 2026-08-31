import { invoke } from "@tauri-apps/api/core";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import type { FunScene, FunObject, Mesh3DObject } from "@/canvas/types";
import {
  parseExcalidrawContent,
  prepareExcalidrawScene,
} from "@/lib/excalidraw-sanitize";

export type CreateDiagramResult = {
  path: string;
  name: string;
};

export type LoadDiagramResult = {
  path: string;
  content: string;
};

export type DiagramListItem = {
  path: string;
  name: string;
};

export type { ExcalidrawInitialDataState };
export { parseExcalidrawContent, prepareExcalidrawScene };

export async function createDiagram(
  projectPath: string,
): Promise<CreateDiagramResult> {
  return invoke<CreateDiagramResult>("create_diagram", { projectPath });
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
  const excalidrawElements = scene.objects
    .filter((obj) => obj.type !== "mesh3d")
    .map((obj) => {
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

      return base;
    });

  const mesh3dObjects = scene.objects.filter(
    (obj): obj is Mesh3DObject => obj.type === "mesh3d",
  );

  const result = {
    type: "excalidraw" as const,
    version: 2 as const,
    elements: excalidrawElements,
    appState: {
      viewBackgroundColor: "#ffffff",
    },
    files: {},
    _fun3d: mesh3dObjects.length > 0 ? mesh3dObjects : undefined,
  };

  return JSON.stringify(result, null, 2);
}

export async function deserializeFunScene(rawContent: string): Promise<FunScene> {
  const parsed = JSON.parse(rawContent);

  const excalidrawData = {
    elements: parsed.elements ?? [],
    appState: parsed.appState ?? { viewBackgroundColor: "#ffffff" },
    files: parsed.files ?? {},
  };

  const excalidrawElements = await parseExcalidrawContent(
    JSON.stringify(excalidrawData),
  );

  const mesh3dObjects: Mesh3DObject[] = parsed._fun3d ?? [];

  const excalidrawObjects: FunObject[] = (excalidrawElements.elements ?? []).map(
    (el: Record<string, unknown>) => {
      const rawType = el.type === "freedraw" ? "freehand" : el.type;
      const type = rawType as "freehand" | "rect" | "ellipse" | "diamond" | "text";
      return {
        id: el.id as string,
        type,
        x: el.x as number,
        y: el.y as number,
        width: el.width as number,
        height: el.height as number,
        fill: (el.backgroundColor as string) ?? "transparent",
        stroke: (el.strokeColor as string) ?? "#1a1a1a",
        strokeWidth: (el.strokeWidth as number) ?? 2,
        opacity: (el.opacity as number) ?? 100,
        locked: (el.locked as boolean) ?? false,
        zIndex: 0,
        points: el.points as { x: number; y: number }[],
        text: el.text as string,
        fontSize: el.fontSize as number,
        borderRadius: 0,
      } as FunObject;
    },
  );

  return {
    id: crypto.randomUUID(),
    objects: [...excalidrawObjects, ...mesh3dObjects],
    camera: { x: 0, y: 0, zoom: 1 },
    grid: true,
    version: 1,
  };
}
