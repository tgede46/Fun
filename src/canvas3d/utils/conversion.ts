import type { FunObject, Mesh3DObject, Material3D } from "../../canvas/types";

const DEFAULT_MATERIAL: Material3D = {
  color: "#4488ff",
  metalness: 0.2,
  roughness: 0.8,
  opacity: 1,
  wireframe: false,
};

export function funObjectToMesh3D(obj: FunObject): Mesh3DObject | null {
  if (obj.type === "mesh3d") {
    return obj;
  }

  const base = {
    id: obj.id,
    type: "mesh3d" as const,
    x: obj.x,
    y: obj.y,
    width: obj.width,
    height: obj.height,
    fill: obj.fill,
    stroke: obj.stroke,
    strokeWidth: obj.strokeWidth,
    opacity: obj.opacity,
    locked: obj.locked,
    zIndex: obj.zIndex,
    position: [obj.x / 50, -obj.y / 50, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    material: { ...DEFAULT_MATERIAL, color: obj.fill === "transparent" ? obj.stroke : obj.fill },
  };

  switch (obj.type) {
    case "rect":
      return {
        ...base,
        geometry: "box",
      };
    case "ellipse":
      return {
        ...base,
        geometry: "sphere",
      };
    case "diamond":
      return {
        ...base,
        geometry: "box",
        rotation: [0, Math.PI / 4, 0],
      };
    case "freehand":
      return {
        ...base,
        geometry: "extrude",
        extrudeShape: {
          points: obj.points.map((p) => ({ x: p.x, y: p.y })),
          depth: 0.1,
        },
      };
    case "text":
      return {
        ...base,
        geometry: "box",
        material: { ...DEFAULT_MATERIAL, color: "#ffffff" },
      };
    default:
      return null;
  }
}

export function mesh3DToFunObject(mesh: Mesh3DObject): FunObject {
  const x = mesh.position[0] * 50;
  const y = -mesh.position[1] * 50;

  if (mesh.geometry === "extrude" && mesh.extrudeShape) {
    return {
      id: mesh.id,
      type: "freehand",
      x,
      y,
      width: mesh.width,
      height: mesh.height,
      fill: mesh.material.color,
      stroke: mesh.material.color,
      strokeWidth: 2,
      opacity: mesh.material.opacity,
      locked: mesh.locked,
      zIndex: mesh.zIndex,
      points: mesh.extrudeShape.points,
    };
  }

  const shapeType = mesh.geometry === "sphere" ? "ellipse" : "rect";

  return {
    id: mesh.id,
    type: shapeType as "rect" | "ellipse",
    x,
    y,
    width: mesh.width,
    height: mesh.height,
    fill: mesh.material.color,
    stroke: mesh.material.color,
    strokeWidth: 2,
    opacity: mesh.material.opacity,
    locked: mesh.locked,
    zIndex: mesh.zIndex,
    borderRadius: 0,
  };
}