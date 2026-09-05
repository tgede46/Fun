import { describe, it, expect } from "vitest";
import { pointInObject, pointNearEdge, objectBBox, distance } from "@/canvas/utils/geometry";
import type { FunObject } from "@/canvas/types";

describe("distance", () => {
  it("returns 0 for same point", () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it("computes Euclidean distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("objectBBox", () => {
  it("returns bbox for rect", () => {
    const obj: FunObject = {
      id: "1", type: "rect", x: 10, y: 20, width: 100, height: 50,
      fill: "transparent", stroke: "#000", strokeWidth: 2, opacity: 1,
      locked: false, zIndex: 0, borderRadius: 0,
    };
    expect(objectBBox(obj)).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("computes bbox for freehand path", () => {
    const obj: FunObject = {
      id: "1", type: "freehand", x: 0, y: 0, width: 0, height: 0,
      fill: "transparent", stroke: "#000", strokeWidth: 2, opacity: 1,
      locked: false, zIndex: 0,
      points: [{ x: 10, y: 20 }, { x: 50, y: 80 }, { x: 30, y: 5 }],
    };
    const bbox = objectBBox(obj);
    expect(bbox).toEqual({ x: 10, y: 5, width: 40, height: 75 });
  });
});

describe("pointInObject", () => {
  it("detects point inside rect", () => {
    const obj: FunObject = {
      id: "1", type: "rect", x: 0, y: 0, width: 100, height: 80,
      fill: "transparent", stroke: "#000", strokeWidth: 2, opacity: 1,
      locked: false, zIndex: 0, borderRadius: 0,
    };
    expect(pointInObject(50, 40, obj)).toBe(true);
    expect(pointInObject(150, 40, obj)).toBe(false);
  });

  it("detects point inside ellipse", () => {
    const obj: FunObject = {
      id: "1", type: "ellipse", x: 0, y: 0, width: 100, height: 60,
      fill: "transparent", stroke: "#000", strokeWidth: 2, opacity: 1,
      locked: false, zIndex: 0,
    };
    expect(pointInObject(50, 30, obj)).toBe(true);
    expect(pointInObject(0, 0, obj)).toBe(false);
  });

  it("detects point inside diamond", () => {
    const obj: FunObject = {
      id: "1", type: "diamond", x: 0, y: 0, width: 100, height: 100,
      fill: "transparent", stroke: "#000", strokeWidth: 2, opacity: 1,
      locked: false, zIndex: 0,
    };
    expect(pointInObject(50, 50, obj)).toBe(true);
    expect(pointInObject(0, 0, obj)).toBe(false);
  });

  it("returns false for out-of-bounds point", () => {
    const obj: FunObject = {
      id: "1", type: "rect", x: 0, y: 0, width: 100, height: 80,
      fill: "transparent", stroke: "#000", strokeWidth: 2, opacity: 1,
      locked: true, zIndex: 0, borderRadius: 0,
    };
    expect(pointInObject(200, 200, obj)).toBe(false);
  });

  it("falls back to bbox for UML types", () => {
    const obj: FunObject = {
      id: "1", type: "uml-class", x: 0, y: 0, width: 120, height: 100,
      fill: "transparent", stroke: "#000", strokeWidth: 2, opacity: 1,
      locked: false, zIndex: 0,
      name: "TestClass",
      attributes: [],
      methods: [],
      compartmentsVisible: true,
    };
    expect(pointInObject(60, 50, obj)).toBe(true);
    expect(pointInObject(200, 200, obj)).toBe(false);
  });
});

describe("pointNearEdge", () => {
  it("detects point near a line", () => {
    expect(pointNearEdge(5, 0, 0, 0, 10, 0, 3)).toBe(true);
    expect(pointNearEdge(5, 10, 0, 0, 10, 0, 3)).toBe(false);
  });

  it("detects point near endpoints", () => {
    expect(pointNearEdge(0, 0, 0, 0, 10, 10, 5)).toBe(true);
    expect(pointNearEdge(10, 10, 0, 0, 10, 10, 5)).toBe(true);
  });

  it("returns false for distant point", () => {
    expect(pointNearEdge(100, 100, 0, 0, 10, 0, 5)).toBe(false);
  });
});
