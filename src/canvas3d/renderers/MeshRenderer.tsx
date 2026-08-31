"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh3DObject } from "../../canvas/types";
import type { Mesh } from "three";

interface MeshRendererProps {
  mesh: Mesh3DObject;
  isSelected?: boolean;
  onClick?: () => void;
}

export function MeshRenderer({ mesh, isSelected = false, onClick }: MeshRendererProps) {
  const meshRef = useRef<Mesh>(null);

  const geometry = (() => {
    switch (mesh.geometry) {
      case "box":
        return <boxGeometry args={[mesh.width, mesh.height, 1]} />;
      case "sphere":
        return <sphereGeometry args={[Math.min(mesh.width, mesh.height) / 2, 32, 32]} />;
      case "cylinder":
        return <cylinderGeometry args={[mesh.width / 2, mesh.width / 2, mesh.height, 32]} />;
      case "cone":
        return <coneGeometry args={[mesh.width / 2, mesh.height, 32]} />;
      case "torus":
        return <torusGeometry args={[mesh.width / 2, mesh.width / 6, 16, 32]} />;
      default:
        return <boxGeometry args={[mesh.width, mesh.height, 1]} />;
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
        onClick?.();
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
        emissive={isSelected ? "#4488ff" : "#000000"}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
    </mesh>
  );
}