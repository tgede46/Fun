import { describe, it, expect } from "vitest";
import { serializeFunScene } from "@/lib/diagram";
import { parseSceneFromJSON } from "@/canvas/utils/serialization";
import type { FunScene } from "@/canvas/types";

function makeScene(overrides?: Partial<FunScene>): FunScene {
  return {
    id: "test-id",
    objects: [
      {
        id: "obj-1",
        type: "rect",
        x: 0,
        y: 0,
        width: 100,
        height: 80,
        fill: "transparent",
        stroke: "#1e1e1e",
        strokeWidth: 2,
        opacity: 1,
        locked: false,
        zIndex: 0,
        borderRadius: 0,
      },
      {
        id: "obj-2",
        type: "ellipse",
        x: 200,
        y: 100,
        width: 120,
        height: 80,
        fill: "transparent",
        stroke: "#1e1e1e",
        strokeWidth: 2,
        opacity: 1,
        locked: false,
        zIndex: 1,
      },
    ],
    edges: [
      {
        id: "edge-1",
        type: "edge",
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
        fromId: "obj-1",
        toId: "obj-2",
        kind: "association",
      },
      {
        id: "edge-2",
        type: "edge",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        fill: "transparent",
        stroke: "#4f8ff7",
        strokeWidth: 2,
        opacity: 1,
        locked: false,
        zIndex: 0,
        fromId: "obj-1",
        toId: "obj-2",
        kind: "inheritance",
        label: "extends",
      },
    ],
    camera: { x: 0, y: 0, zoom: 1 },
    grid: true,
    version: 1,
    ...overrides,
  };
}

describe("serializeFunScene", () => {
  it("includes edges in output", () => {
    const scene = makeScene();
    const json = serializeFunScene(scene);
    const parsed = JSON.parse(json);

    expect(parsed.edges).toHaveLength(2);
    expect(parsed.edges[0].fromId).toBe("obj-1");
    expect(parsed.edges[0].toId).toBe("obj-2");
    expect(parsed.edges[0].kind).toBe("association");
  });

  it("preserves edge labels", () => {
    const scene = makeScene();
    const json = serializeFunScene(scene);
    const parsed = JSON.parse(json);

    expect(parsed.edges[1].label).toBe("extends");
  });

  it("produces valid Excalidraw format with edges", () => {
    const scene = makeScene();
    const json = serializeFunScene(scene);
    const parsed = JSON.parse(json);

    expect(parsed.type).toBe("excalidraw");
    expect(parsed.version).toBe(2);
    expect(Array.isArray(parsed.elements)).toBe(true);
    expect(Array.isArray(parsed.edges)).toBe(true);
  });

  it("serializes freehand points", () => {
    const scene = makeScene({
      objects: [
        {
          id: "fh-1",
          type: "freehand",
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 2,
          opacity: 1,
          locked: false,
          zIndex: 0,
          points: [
            { x: 0, y: 0 },
            { x: 25, y: 10 },
            { x: 50, y: 50 },
          ],
        },
      ],
      edges: [],
    });
    const json = serializeFunScene(scene);
    const parsed = JSON.parse(json);
    const el = parsed.elements[0];

    expect(el.type).toBe("freedraw");
    expect(el.points).toHaveLength(3);
  });

  it("serializes arrow objects", () => {
    const scene = makeScene({
      objects: [
        {
          id: "arr-1",
          type: "arrow",
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 2,
          opacity: 1,
          locked: false,
          zIndex: 0,
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 50 },
          ],
          arrowHead: "triangle",
        },
      ],
      edges: [],
    });
    const json = serializeFunScene(scene);
    const parsed = JSON.parse(json);
    const el = parsed.elements[0];

    expect(el.type).toBe("arrow");
    expect(el.points).toHaveLength(2);
  });

  it("roundtrips scene through JSON string", () => {
    const scene = makeScene();
    const json = serializeFunScene(scene);
    const parsed = JSON.parse(json);

    expect(parsed.edges[0].kind).toBe("association");
    expect(parsed.edges[1].kind).toBe("inheritance");
    expect(parsed.edges[1].label).toBe("extends");
    expect(parsed.elements).toHaveLength(2);
  });
});

describe("parseSceneFromJSON", () => {
  it("parses valid FunScene JSON", () => {
    const scene = makeScene();
    const json = JSON.stringify(scene);
    const parsed = parseSceneFromJSON(json);

    expect(parsed).not.toBeNull();
    expect(parsed!.objects).toHaveLength(2);
    expect(parsed!.edges).toHaveLength(2);
  });

  it("returns null for invalid JSON", () => {
    expect(parseSceneFromJSON("not json")).toBeNull();
  });

  it("returns null for wrong version", () => {
    const json = JSON.stringify({ version: 2, objects: [], edges: [] });
    expect(parseSceneFromJSON(json)).toBeNull();
  });

  it("returns null for missing objects", () => {
    const json = JSON.stringify({ version: 1 });
    expect(parseSceneFromJSON(json)).toBeNull();
  });
});
