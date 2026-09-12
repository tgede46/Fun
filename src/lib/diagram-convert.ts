import type { FunScene } from "@/canvas/types";
import { excalidrawToFunScene } from "@/canvas/adapters/excalidraw";
import { drawioXmlToFunScene, funSceneToDrawioXml } from "@/canvas/adapters/drawio";
import { funSceneToPlantUml, plantumlToFunScene } from "@/canvas/adapters/plantuml";
import { serializeFunScene } from "@/lib/diagram";
import type { DiagramKind } from "@/lib/diagram";

export function kindFromPath(path: string): DiagramKind {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "drawio") return "drawio";
  if (ext === "puml") return "plantuml";
  return "sketch";
}

/** Compare deux chemins diagramme (Windows / Linux). */
export function diagramPathsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");
  return norm(a) === norm(b);
}

export function kindToWorkshopMode(kind: DiagramKind): "sketch" | "uml" | "plantuml" {
  if (kind === "drawio") return "uml";
  if (kind === "plantuml") return "plantuml";
  return "sketch";
}

export function sceneFromContent(kind: DiagramKind, content: string): FunScene {
  switch (kind) {
    case "drawio":
      return drawioXmlToFunScene(content, { sourceFormat: "drawio" });
    case "plantuml":
      return plantumlToFunScene(content, { sourceFormat: "plantuml" });
    case "sketch": {
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        return { objects: [], edges: [] };
      }
      const elements = Array.isArray(parsed)
        ? parsed
        : (parsed as { elements?: unknown }).elements ?? [];
      const scene = excalidrawToFunScene(
        elements as Parameters<typeof excalidrawToFunScene>[0],
        { sourceFormat: "excalidraw" },
      );
      const edges = (parsed as { edges?: FunScene["edges"] }).edges;
      return { ...scene, edges: edges ?? scene.edges ?? [] };
    }
  }
}

export function contentFromScene(kind: DiagramKind, scene: FunScene): string {
  switch (kind) {
    case "drawio":
      return funSceneToDrawioXml(scene, { minify: false });
    case "plantuml":
      return funSceneToPlantUml(scene);
    case "sketch":
      return serializeFunScene(scene);
  }
}

export function convertDiagramContent(
  sourceKind: DiagramKind,
  targetKind: DiagramKind,
  content: string,
): { content: string; scene: FunScene; lostRatio: number; sourceEmpty: boolean } {
  const scene = sceneFromContent(sourceKind, content);
  const sourceCount = scene.objects.length;
  const target = contentFromScene(targetKind, scene);
  if (sourceCount === 0) {
    return { content: target, scene, lostRatio: 0, sourceEmpty: true };
  }
  const roundTrip = sceneFromContent(targetKind, target);
  const lostRatio = Math.max(0, 1 - roundTrip.objects.length / sourceCount);
  return { content: target, scene, lostRatio, sourceEmpty: false };
}
