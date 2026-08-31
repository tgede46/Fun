import { useCallback, useState } from "react";
import type { Mesh3DGeometry, Material3D, Mesh3DObject } from "../../canvas/types";

export type Tool3DType = "select" | "box" | "sphere" | "cylinder" | "cone" | "torus";

const DEFAULT_MATERIAL: Material3D = {
  color: "#4488ff",
  metalness: 0.2,
  roughness: 0.8,
  opacity: 1,
  wireframe: false,
};

const GEOMETRY_MAP: Record<string, Mesh3DGeometry> = {
  box: "box",
  sphere: "sphere",
  cylinder: "cylinder",
  cone: "cone",
  torus: "torus",
};

export function useTool3D(onAddMesh?: (mesh: Mesh3DObject) => void) {
  const [activeTool, setActiveTool] = useState<Tool3DType>("select");
  const [activeColor, setActiveColor] = useState("#4488ff");

  const selectTool = useCallback((tool: Tool3DType) => {
    setActiveTool(tool);
  }, []);

  const createMeshAt = useCallback(
    (position: [number, number, number], size?: number) => {
      if (activeTool === "select") return null;

      const s = size ?? 1;
      const geometry = GEOMETRY_MAP[activeTool];

      const mesh: Mesh3DObject = {
        id: crypto.randomUUID(),
        type: "mesh3d",
        geometry,
        x: position[0] * 50,
        y: -position[1] * 50,
        width: s * 50,
        height: s * 50,
        fill: activeColor,
        stroke: activeColor,
        strokeWidth: 2,
        opacity: 1,
        locked: false,
        zIndex: 0,
        position,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        material: { ...DEFAULT_MATERIAL, color: activeColor },
      };

      onAddMesh?.(mesh);
      return mesh;
    },
    [activeTool, activeColor, onAddMesh],
  );

  return {
    activeTool,
    activeColor,
    selectTool,
    setActiveColor,
    createMeshAt,
  };
}