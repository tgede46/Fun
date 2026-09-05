import type { FunScene } from "../types";

export function serializeSceneToJSON(scene: FunScene): string {
  return JSON.stringify(scene, null, 2);
}

export function parseSceneFromJSON(json: string): FunScene | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.objects)) {
      return parsed as FunScene;
    }
    return null;
  } catch {
    return null;
  }
}

export function createEmptyScene(): FunScene {
  return {
    id: crypto.randomUUID(),
    objects: [],
    edges: [],
    camera: { x: 0, y: 0, zoom: 1 },
    grid: true,
    version: 1,
  };
}
