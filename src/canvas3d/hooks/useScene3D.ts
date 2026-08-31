import { useCallback, useMemo } from "react";
import type { FunScene, Mesh3DObject, FunObject } from "../../canvas/types";

export function useScene3D(scene: FunScene) {
  const meshes = useMemo(() => {
    return scene.objects.filter((obj): obj is Mesh3DObject => obj.type === "mesh3d");
  }, [scene.objects]);

  const addMesh = useCallback(
    (mesh: Mesh3DObject) => {
      // This would be called from a tool to add a new 3D object
      // The actual state update happens through onSceneChange
    },
    [],
  );

  const updateMesh = useCallback(
    (id: string, patch: Partial<Mesh3DObject>) => {
      // This would be called from transform controls
      // The actual state update happens through onSceneChange
    },
    [],
  );

  const deleteMesh = useCallback(
    (id: string) => {
      // This would be called to remove a 3D object
      // The actual state update happens through onSceneChange
    },
    [],
  );

  return {
    meshes,
    addMesh,
    updateMesh,
    deleteMesh,
  };
}