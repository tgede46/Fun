import { invoke } from "@tauri-apps/api/core";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

export type CreateDiagramResult = {
  path: string;
  name: string;
};

export type LoadDiagramResult = {
  path: string;
  content: string;
};

export type { ExcalidrawInitialDataState };

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

export function parseExcalidrawContent(content: string): ExcalidrawInitialDataState {
  let parsed: ExcalidrawInitialDataState & {
    app_state?: ExcalidrawInitialDataState["appState"];
  };

  try {
    parsed = JSON.parse(content) as ExcalidrawInitialDataState & {
      app_state?: ExcalidrawInitialDataState["appState"];
    };
  } catch {
    throw new Error("Le fichier diagramme est illisible.");
  }

  return {
    elements: parsed.elements ?? [],
    appState: parsed.appState ?? parsed.app_state ?? {},
    files: parsed.files ?? {},
  };
}

export async function createAndLoadDiagram(
  projectPath: string,
): Promise<{
  path: string;
  name: string;
  initialData: ExcalidrawInitialDataState;
}> {
  const created = await createDiagram(projectPath);
  const loaded = await loadDiagram(projectPath, created.path);

  return {
    path: loaded.path,
    name: created.name,
    initialData: parseExcalidrawContent(loaded.content),
  };
}
