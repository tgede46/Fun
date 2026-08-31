"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { FunScene, Mesh3DObject, Mesh3DGeometry, Material3D } from "../canvas/types";
import { MeshRenderer } from "./renderers/MeshRenderer";
import * as THREE from "three";

type Tool3D = "select" | "box" | "sphere" | "cylinder" | "cone" | "move";

interface Canvas3DProps {
  scene: FunScene;
  onSceneChange?: (scene: FunScene) => void;
}

const COLORS = [
  "#4488ff", "#ff4444", "#44ff44", "#ffff44",
  "#ff44ff", "#44ffff", "#ff8844", "#8844ff",
];

const DEFAULT_MATERIAL: Material3D = {
  color: "#4488ff",
  metalness: 0.2,
  roughness: 0.8,
  opacity: 1,
  wireframe: false,
};

function Object3D({
  mesh,
  isSelected,
  onClick,
  onDragEnd,
}: {
  mesh: Mesh3DObject;
  isSelected: boolean;
  onClick: () => void;
  onDragEnd: (position: [number, number, number]) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const geometry = (() => {
    switch (mesh.geometry) {
      case "box":
        return <boxGeometry args={[mesh.width / 50, mesh.height / 50, 1]} />;
      case "sphere":
        return <sphereGeometry args={[Math.min(mesh.width, mesh.height) / 100, 32, 32]} />;
      case "cylinder":
        return <cylinderGeometry args={[mesh.width / 100, mesh.width / 100, mesh.height / 50, 32]} />;
      case "cone":
        return <coneGeometry args={[mesh.width / 100, mesh.height / 50, 32]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  })();

  return (
    <mesh
      ref={meshRef}
      position={mesh.position}
      rotation={mesh.rotation}
      scale={mesh.scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {geometry}
      <meshStandardMaterial
        color={mesh.material.color}
        metalness={mesh.material.metalness}
        roughness={mesh.material.roughness}
        transparent={mesh.material.opacity < 1}
        opacity={mesh.material.opacity}
        wireframe={mesh.material.wireframe}
        emissive={isSelected ? "#4488ff" : hovered ? "#333333" : "#000000"}
        emissiveIntensity={isSelected ? 0.5 : hovered ? 0.2 : 0}
      />
    </mesh>
  );
}

function Scene3D({
  meshes,
  activeTool,
  activeColor,
  onAddMesh,
  onSelectMesh,
  selectedId,
  onUpdateMesh,
}: {
  meshes: Mesh3DObject[];
  activeTool: Tool3D;
  activeColor: string;
  onAddMesh: (mesh: Mesh3DObject) => void;
  onSelectMesh: (id: string | null) => void;
  selectedId: string | null;
  onUpdateMesh: (id: string, position: [number, number, number]) => void;
}) {
  const transformRef = useRef<any>(null);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (activeTool === "select" || activeTool === "move") {
        return;
      }

      const point = e.point;
      if (!point) return;

      // Snapper sur la grille (pas de chevauchement)
      const gridSize = 1.5; // Espacement entre les objets
      const snappedX = Math.round(point.x / gridSize) * gridSize;
      const snappedZ = Math.round(point.z / gridSize) * gridSize;

      // Vérifier s'il y a déjà un objet à cet emplacement
      const existingMesh = meshes.find((m) => {
        const dx = Math.abs(m.position[0] - snappedX);
        const dz = Math.abs(m.position[2] - snappedZ);
        return dx < 1 && dz < 1;
      });

      if (existingMesh) {
        return; // Ne pas placer si déjà occupé
      }

      const size = 1;
      const geometry: Mesh3DGeometry = activeTool === "box" ? "box" :
        activeTool === "sphere" ? "sphere" :
        activeTool === "cylinder" ? "cylinder" : "cone";

      const mesh: Mesh3DObject = {
        id: crypto.randomUUID(),
        type: "mesh3d",
        geometry,
        x: snappedX * 50,
        y: 0,
        width: size * 50,
        height: size * 50,
        fill: activeColor,
        stroke: activeColor,
        strokeWidth: 2,
        opacity: 1,
        locked: false,
        zIndex: 0,
        position: [snappedX, size / 2, snappedZ],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        material: { ...DEFAULT_MATERIAL, color: activeColor },
      };

      onAddMesh(mesh);
    },
    [activeTool, activeColor, meshes, onAddMesh],
  );

  const selectedMesh = meshes.find((m) => m.id === selectedId);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* Ground plane pour capturer les clics */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <Grid
        infiniteGrid
        cellSize={1}
        sectionSize={5}
        fadeDistance={50}
        fadeStrength={1}
      />

      <Suspense fallback={null}>
        {meshes.map((mesh) => (
          <Object3D
            key={mesh.id}
            mesh={mesh}
            isSelected={selectedId === mesh.id}
            onClick={() => onSelectMesh(mesh.id)}
            onDragEnd={(pos) => onUpdateMesh(mesh.id, pos)}
          />
        ))}
      </Suspense>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        enabled={activeTool === "select"}
      />
    </>
  );
}

export function Canvas3D({ scene, onSceneChange }: Canvas3DProps) {
  const [activeTool, setActiveTool] = useState<Tool3D>("select");
  const [activeColor, setActiveColor] = useState("#4488ff");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const meshes = scene.objects.filter(
    (obj): obj is Mesh3DObject => obj.type === "mesh3d",
  );

  const handleAddMesh = useCallback(
    (mesh: Mesh3DObject) => {
      if (!onSceneChange) return;
      onSceneChange({
        ...scene,
        objects: [...scene.objects, mesh],
      });
    },
    [scene, onSceneChange],
  );

  const handleUpdateMesh = useCallback(
    (id: string, position: [number, number, number]) => {
      if (!onSceneChange) return;
      onSceneChange({
        ...scene,
        objects: scene.objects.map((obj) =>
          obj.id === id && obj.type === "mesh3d"
            ? { ...obj, position, x: position[0] * 50, y: -position[1] * 50 }
            : obj,
        ),
      });
    },
    [scene, onSceneChange],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId || !onSceneChange) return;
    onSceneChange({
      ...scene,
      objects: scene.objects.filter((o) => o.id !== selectedId),
    });
    setSelectedId(null);
  }, [selectedId, scene, onSceneChange]);

  const handleDuplicate = useCallback(() => {
    if (!selectedId || !onSceneChange) return;
    const mesh = meshes.find((m) => m.id === selectedId);
    if (!mesh) return;

    const newMesh: Mesh3DObject = {
      ...mesh,
      id: crypto.randomUUID(),
      position: [mesh.position[0] + 2, mesh.position[1], mesh.position[2]],
      x: (mesh.position[0] + 2) * 50,
    };

    onSceneChange({
      ...scene,
      objects: [...scene.objects, newMesh],
    });
  }, [selectedId, meshes, scene, onSceneChange]);

  return (
    <div className="flex-1 relative min-h-0 bg-gray-900 flex flex-col">
      {/* Toolbar 3D */}
      <div className="flex items-center gap-2 p-2 bg-card border-b border-border flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Outils:</span>
        {(["select", "box", "sphere", "cylinder", "cone"] as Tool3D[]).map((tool) => (
          <button
            key={tool}
            type="button"
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTool === tool
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            }`}
            onClick={() => setActiveTool(tool)}
          >
            {tool === "select" && "↖ Sélect"}
            {tool === "box" && "□ Boîte"}
            {tool === "sphere" && "○ Sphère"}
            {tool === "cylinder" && "▭ Cylindre"}
            {tool === "cone" && "△ Cône"}
          </button>
        ))}

        <div className="w-px h-4 bg-border mx-1" />

        <span className="text-xs text-muted-foreground mr-1">Couleur:</span>
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              activeColor === color ? "border-white scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
            onClick={() => setActiveColor(color)}
          />
        ))}

        {selectedId && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              type="button"
              className="px-2 py-1 text-xs rounded bg-accent text-accent-foreground hover:bg-accent/80"
              onClick={handleDuplicate}
            >
              Dupliquer
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs rounded bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSelected}
            >
              Supprimer
            </button>
          </>
        )}
      </div>

      {/* Canvas 3D */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [8, 8, 8], fov: 50 }}
          gl={{ antialias: true }}
          onPointerMissed={() => setSelectedId(null)}
        >
          <Scene3D
            meshes={meshes}
            activeTool={activeTool}
            activeColor={activeColor}
            onAddMesh={handleAddMesh}
            onSelectMesh={setSelectedId}
            selectedId={selectedId}
            onUpdateMesh={handleUpdateMesh}
          />
        </Canvas>

        {/* Instructions */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-card/90 border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
          {activeTool === "select"
            ? "Cliquez sur un objet pour le sélectionner • Molette pour zoomer • Clic molette pour orbitter"
            : `Cliquez sur le grid pour placer un ${activeTool}`}
        </div>
      </div>
    </div>
  );
}