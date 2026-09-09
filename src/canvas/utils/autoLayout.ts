import type { FunScene } from "../types";

const COL_GAP = 220;
const ROW_GAP = 140;
const ORIGIN_X = 80;
const ORIGIN_Y = 80;

/** Place les objets en rangées (BFS sur les liens) pour un rendu PlantUML lisible. */
export function autoLayoutScene(scene: FunScene): FunScene {
  const objects = scene.objects.map((obj) => ({ ...obj }));
  const edges = scene.edges ?? [];
  const index = new Map(objects.map((obj, i) => [obj.id, i]));

  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, number>();
  for (const obj of objects) {
    outgoing.set(obj.id, []);
    incoming.set(obj.id, 0);
  }
  for (const edge of edges) {
    if (!index.has(edge.fromId) || !index.has(edge.toId)) continue;
    outgoing.get(edge.fromId)?.push(edge.toId);
    incoming.set(edge.toId, (incoming.get(edge.toId) ?? 0) + 1);
  }

  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const obj of objects) {
    if ((incoming.get(obj.id) ?? 0) === 0) {
      depth.set(obj.id, 0);
      queue.push(obj.id);
    }
  }
  if (queue.length === 0 && objects[0]) {
    depth.set(objects[0].id, 0);
    queue.push(objects[0].id);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    const d = depth.get(id) ?? 0;
    for (const next of outgoing.get(id) ?? []) {
      const nextDepth = Math.max(depth.get(next) ?? 0, d + 1);
      if (!depth.has(next) || nextDepth > (depth.get(next) ?? 0)) {
        depth.set(next, nextDepth);
        queue.push(next);
      }
    }
  }

  const rows = new Map<number, string[]>();
  for (const obj of objects) {
    const row = depth.get(obj.id) ?? 0;
    const list = rows.get(row) ?? [];
    list.push(obj.id);
    rows.set(row, list);
  }

  for (const [row, ids] of rows) {
    ids.forEach((id, col) => {
      const i = index.get(id);
      if (i === undefined) return;
      const obj = objects[i];
      const width = Math.max(obj.width || 160, 140);
      const height = Math.max(obj.height || 80, 60);
      objects[i] = {
        ...obj,
        x: ORIGIN_X + col * COL_GAP,
        y: ORIGIN_Y + row * ROW_GAP,
        width,
        height,
      };
    });
  }

  return { ...scene, objects, edges };
}
