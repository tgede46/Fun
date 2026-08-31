"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { FunScene, Mesh3DObject, FunObject, Material3D } from "../canvas/types";
import { MeshRenderer } from "./renderers/MeshRenderer";
import * as THREE from "three";

type Tool3D = "select" | "freehand" | "rect" | "ellipse" | "diamond" | "text";

interface Canvas3DProps {
  scene: FunScene;
  onSceneChange?: (scene: FunScene) => void;
  activeTool?: Tool3D;
  onToolChange?: (tool: Tool3D) => void;
}

const COLORS = [
  "#1a1a1a", "#4488ff", "#ff4444", "#44ff44",
  "#ffff44", "#ff44ff", "#44ffff", "#ff8844",
];

const DEFAULT_MATERIAL: Material3D = {
  color: "#1a1a1a",
  metalness: 0.1,
  roughness: 0.9,
  opacity: 1,
  wireframe: false,
};

function Object3D({
  mesh,
  isSelected,
  onClick,
}: {
  mesh: Mesh3DObject;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const geometry = (() => {
    switch (mesh.geometry) {
      case "box":
        return <boxGeometry args={[mesh.width / 50, mesh.height / 50, 0.2]} />;
      case "sphere":
        return <sphereGeometry args={[Math.min(mesh.width, mesh.height) / 100, 32, 32]} />;
      case "cylinder":
        return <cylinderGeometry args={[mesh.width / 100, mesh.width / 100, mesh.height / 50, 32]} />;
      case "cone":
        return <coneGeometry args={[mesh.width / 100, mesh.height / 50, 32]} />;
      case "torus":
        return <torusGeometry args={[mesh.width / 100, mesh.width / 300, 16, 32]} />;
      default:
        return <boxGeometry args={[1, 1, 0.2]} />;
    }
  })();

  return (
    <mesh
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

function Freehand3D({
  points,
  color,
  isSelected,
  onClick,
}: {
  points: [number, number, number][];
  color: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  if (points.length < 2) return null;

  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
  );
  const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.05, 8, false);

  return (
    <mesh geometry={tubeGeometry} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <meshStandardMaterial
        color={color}
        emissive={isSelected ? "#4488ff" : "#000000"}
        emissiveIntensity={isSelected ? 0.5 : 0}
      />
    </mesh>
  );
}

function Text3D({
  text,
  position,
  color,
  isSelected,
  onClick,
}: {
  text: string;
  position: [number, number, number];
  color: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Text
      position={position}
      fontSize={0.5}
      color={color}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      anchorX="center"
      anchorY="middle"
    >
      {text}
      <meshStandardMaterial
        emissive={isSelected ? "#4488ff" : "#000000"}
        emissiveIntensity={isSelected ? 0.5 : 0}
      />
    </Text>
  );
}

function Scene3D({
  scene,
  meshes,
  activeTool,
  activeColor,
  onAddMesh,
  onSelectMesh,
  selectedId,
}: {
  scene: FunScene;
  meshes: Mesh3DObject[];
  activeTool: Tool3D;
  activeColor: string;
  onAddMesh: (mesh: Mesh3DObject) => void;
  onSelectMesh: (id: string | null) => void;
  selectedId: string | null;
}) {
  const isDrawing = useRef(false);
  const drawStart = useRef<THREE.Vector3 | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<[number, number, number][]>([]);

  const getWorldPoint = useCallback((e: ThreeEvent<PointerEvent>): THREE.Vector3 | null => {
    // @ts-ignore
    return e.point ?? null;
  }, []);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const point = getWorldPoint(e);
      if (!point) return;

      if (activeTool === "select") {
        onSelectMesh(null);
        return;
      }

      if (activeTool === "freehand") {
        isDrawing.current = true;
        setFreehandPoints([[point.x, point.y, point.z]]);
        return;
      }

      // Pour rect, ellipse, diamond, text : placement simple
      const gridSize = 1.5;
      const snappedX = Math.round(point.x / gridSize) * gridSize;
      const snappedZ = Math.round(point.z / gridSize) * gridSize;

      // Vérifier chevauchement
      const existingMesh = meshes.find((m) => {
        const dx = Math.abs(m.position[0] - snappedX);
        const dz = Math.abs(m.position[2] - snappedZ);
        return dx < 1 && dz < 1;
      });

      if (existingMesh) return;

      const size = 1;
      let geometry: Mesh3DObject["geometry"] = "box";

      if (activeTool === "rect") geometry = "box";
      else if (activeTool === "ellipse") geometry = "sphere";
      else if (activeTool === "diamond") geometry = "box";
      else if (activeTool === "text") {
        // Texte : créer un mesh avec le texte
        const textMesh: Mesh3DObject = {
          id: crypto.randomUUID(),
          type: "mesh3d",
          geometry: "box",
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
          position: [snappedX, 0.5, snappedZ],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          material: { ...DEFAULT_MATERIAL, color: activeColor },
        };
        onAddMesh(textMesh);
        return;
      }

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
        rotation: activeTool === "diamond" ? [0, Math.PI / 4, 0] : [0, 0, 0],
        scale: [1, 1, 1],
        material: { ...DEFAULT_MATERIAL, color: activeColor },
      };

      onAddMesh(mesh);
    },
    [activeTool, activeColor, meshes, onAddMesh, onSelectMesh, getWorldPoint],
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDrawing.current || activeTool !== "freehand") return;

      const point = getWorldPoint(e);
      if (!point) return;

      setFreehandPoints((prev) => [...prev, [point.x, point.y + 0.1, point.z]]);
    },
    [activeTool, getWorldPoint],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current || activeTool !== "freehand") return;

    isDrawing.current = false;

    if (freehandPoints.length < 2) {
      setFreehandPoints([]);
      return;
    }

    // Créer un mesh freehand (tube le long des points)
    const mesh: Mesh3DObject = {
      id: crypto.randomUUID(),
      type: "mesh3d",
      geometry: "extrude",
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      fill: activeColor,
      stroke: activeColor,
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      material: { ...DEFAULT_MATERIAL, color: activeColor },
      extrudeShape: {
        points: freehandPoints.map((p) => ({ x: p[0], y: p[2] })),
        depth: 0.1,
      },
    };

    onAddMesh(mesh);
    setFreehandPoints([]);
  }, [activeTool, activeColor, freehandPoints, onAddMesh]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* Ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
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
          />
        ))}
      </Suspense>

      {/* Freehand preview */}
      {freehandPoints.length > 1 && (
        <Freehand3D
          points={freehandPoints}
          color={activeColor}
          isSelected={false}
          onClick={() => {}}
        />
      )}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        enabled={activeTool === "select"}
      />
    </>
  );
}

export function Canvas3D({
  scene,
  onSceneChange,
  activeTool: externalTool,
  onToolChange,
}: Canvas3DProps) {
  const [internalTool, setInternalTool] = useState<Tool3D>("select");
  const [activeColor, setActiveColor] = useState("#1a1a1a");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeTool = externalTool ?? internalTool;

  const handleToolChange = useCallback(
    (tool: Tool3D) => {
      setInternalTool(tool);
      onToolChange?.(tool);
    },
    [onToolChange],
  );

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
      {/* Canvas 3D */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [8, 8, 8], fov: 50 }}
          gl={{ antialias: true }}
          onPointerMissed={() => setSelectedId(null)}
        >
          <Scene3D
            scene={scene}
            meshes={meshes}
            activeTool={activeTool}
            activeColor={activeColor}
            onAddMesh={handleAddMesh}
            onSelectMesh={setSelectedId}
            selectedId={selectedId}
          />
        </Canvas>

        {/* Floating toolbar */}
        <div className="absolute bottom-3 left-3 flex gap-1 bg-card border border-border rounded-lg p-1 shadow-sm">
          <button
            type="button"
            className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
              activeTool === "select"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            title="Sélection (V)"
            onClick={() => handleToolChange("select")}
          >
            ↗
          </button>
          <button
            type="button"
            className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
              activeTool === "freehand"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            title="Crayon (P)"
            onClick={() => handleToolChange("freehand")}
          >
            ✎
          </button>
          <button
            type="button"
            className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
              activeTool === "rect"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            title="Rectangle (R)"
            onClick={() => handleToolChange("rect")}
          >
            □
          </button>
          <button
            type="button"
            className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
              activeTool === "ellipse"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            title="Ellipse (O)"
            onClick={() => handleToolChange("ellipse")}
          >
            ○
          </button>
          <button
            type="button"
            className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
              activeTool === "diamond"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            title="Losange (D)"
            onClick={() => handleToolChange("diamond")}
          >
            ◇
          </button>
          <button
            type="button"
            className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
              activeTool === "text"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            title="Texte (T)"
            onClick={() => handleToolChange("text")}
          >
            T
          </button>
        </div>

        {/* Color picker */}
        <div className="absolute bottom-3 right-3 flex gap-1 bg-card border border-border rounded-lg p-1 shadow-sm">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-6 h-6 rounded-full border-2 transition-colors ${
                activeColor === color ? "border-white scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setActiveColor(color)}
            />
          ))}
        </div>

        {/* Actions */}
        {selectedId && (
          <div className="absolute top-3 right-3 flex gap-1 bg-card border border-border rounded-lg p-1 shadow-sm">
            <button
              type="button"
              className="px-2 py-1 text-xs rounded hover:bg-accent/50"
              onClick={handleDuplicate}
            >
              Dupliquer
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs rounded text-destructive hover:bg-destructive/10"
              onClick={handleDeleteSelected}
            >
              Supprimer
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-card/90 border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
          {activeTool === "select"
            ? "Cliquez sur un objet • Molette zoom • Clic molette orbite"
            : activeTool === "freehand"
            ? "Cliquez et glissez pour dessiner en 3D"
            : `Cliquez sur le grid pour placer un ${activeTool}`}
        </div>
      </div>
    </div>
  );
}