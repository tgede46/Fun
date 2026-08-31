"use client";

import { Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { FunScene, Mesh3DObject } from "../canvas/types";
import { MeshRenderer } from "./renderers/MeshRenderer";
import { useScene3D } from "./hooks/useScene3D";

interface Canvas3DProps {
  scene: FunScene;
  onSceneChange?: (scene: FunScene) => void;
  selectedIds?: Set<string>;
  onSelect?: (id: string, additive?: boolean) => void;
}

export function Canvas3D({
  scene,
  onSceneChange,
  selectedIds = new Set(),
  onSelect,
}: Canvas3DProps) {
  const { meshes } = useScene3D(scene);
  const [selectedMesh, setSelectedMesh] = useState<Mesh3DObject | null>(null);

  const handleSelect = useCallback(
    (id: string) => {
      if (onSelect) {
        onSelect(id, false);
      }
      const mesh = meshes.find((m) => m.id === id);
      setSelectedMesh(mesh ?? null);
    },
    [meshes, onSelect],
  );



  return (
    <div className="flex-1 relative min-h-0 bg-gray-900">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        gl={{ antialias: true }}
        onPointerMissed={() => setSelectedMesh(null)}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        <Grid
          infiniteGrid
          cellSize={1}
          sectionSize={5}
          fadeDistance={50}
          fadeStrength={1}
        />

        <Suspense fallback={null}>
          {meshes.map((mesh) => (
            <MeshRenderer
              key={mesh.id}
              mesh={mesh}
              isSelected={selectedIds.has(mesh.id)}
              onClick={() => handleSelect(mesh.id)}
            />
          ))}
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
        />
      </Canvas>
    </div>
  );
}