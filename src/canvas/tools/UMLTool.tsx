import { useCallback, useState, useRef } from "react";
import type { Camera, UMLClassObject, UMLInterfaceObject, UMLAbstractClassObject, UMLEnumObject, UMLActorObject, UMLUseCaseObject, UMLStateObject, UMLComponentObject, UMLNodeObject, UMLDatabaseObject, UMLPackageObject, UMLNoteObject, UMLBoundaryObject, FunObject } from "../types";

type UMLShapeKind =
  | "uml-class"
  | "uml-interface"
  | "uml-abstract-class"
  | "uml-enum"
  | "uml-actor"
  | "uml-usecase"
  | "uml-state"
  | "uml-component"
  | "uml-node"
  | "uml-database"
  | "uml-package"
  | "uml-note"
  | "uml-boundary";

interface UseUMLToolProps {
  camera?: Camera;
  onAdd: (obj: FunObject) => void;
  kind: UMLShapeKind;
  activeColor?: string;
}

const DEFAULT_HEIGHTS: Record<UMLShapeKind, number> = {
  "uml-class": 140,
  "uml-interface": 100,
  "uml-abstract-class": 120,
  "uml-enum": 80,
  "uml-actor": 80,
  "uml-usecase": 60,
  "uml-state": 60,
  "uml-component": 90,
  "uml-node": 70,
  "uml-database": 80,
  "uml-package": 60,
  "uml-note": 80,
  "uml-boundary": 100,
};

export function useUMLTool({ onAdd, kind, activeColor = "#1e1e1e" }: UseUMLToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [preview, setPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const startRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (e.button !== 0) return;
      setIsDrawing(true);
      const world = screenToWorld(e.clientX, e.clientY);
      startRef.current = world;
      const height = DEFAULT_HEIGHTS[kind] ?? 100;
      setPreview({ x: world.x, y: world.y, width: 120, height });
    },
    [kind],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (!isDrawing) return;
      const world = screenToWorld(e.clientX, e.clientY);
      const dx = Math.abs(world.x - startRef.current.x);
      const height = DEFAULT_HEIGHTS[kind] ?? 100;
      setPreview({ x: Math.min(startRef.current.x, world.x), y: startRef.current.y, width: Math.max(80, dx), height });
    },
    [isDrawing, kind],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setPreview(null);

    const x = startRef.current.x;
    const y = startRef.current.y;
    const height = DEFAULT_HEIGHTS[kind] ?? 100;
    const width = preview?.width ?? 120;

    if (width < 20) return;

    const base: Omit<FunObject, "type"> = {
      id: crypto.randomUUID(),
      x,
      y,
      width,
      height,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
    };

    switch (kind) {
      case "uml-class":
        onAdd({
          ...base,
          type: "uml-class",
          name: "ClassName",
          stereotype: undefined,
          attributes: ["+ attr: type"],
          methods: ["+ method()"],
          compartmentsVisible: true,
          fontSize: 14,
        } as UMLClassObject);
        break;
      case "uml-interface":
        onAdd({
          ...base,
          type: "uml-interface",
          name: "InterfaceName",
          stereotype: "<<Interface>>",
          attributes: [],
          methods: ["+ method()"],
          fontSize: 14,
        } as UMLInterfaceObject);
        break;
      case "uml-abstract-class":
        onAdd({
          ...base,
          type: "uml-abstract-class",
          name: "AbstractClass",
          stereotype: "<<Abstract>>",
          attributes: [],
          methods: ["+ doSomething()"],
          fontSize: 14,
        } as UMLAbstractClassObject);
        break;
      case "uml-enum":
        onAdd({
          ...base,
          type: "uml-enum",
          name: "EnumName",
          values: ["VALUE_1", "VALUE_2"],
          fontSize: 14,
        } as UMLEnumObject);
        break;
      case "uml-actor":
        onAdd({
          ...base,
          type: "uml-actor",
          name: "ActorName",
          fontSize: 14,
        } as UMLActorObject);
        break;
      case "uml-usecase":
        onAdd({
          ...base,
          type: "uml-usecase",
          name: "Use Case",
          fontSize: 14,
        } as UMLUseCaseObject);
        break;
      case "uml-state":
        onAdd({
          ...base,
          type: "uml-state",
          name: "StateName",
          stereotype: undefined,
          fontSize: 14,
        } as UMLStateObject);
        break;
      case "uml-component":
        onAdd({
          ...base,
          type: "uml-component",
          name: "Component",
          stereotype: undefined,
          fontSize: 14,
        } as UMLComponentObject);
        break;
      case "uml-node":
        onAdd({
          ...base,
          type: "uml-node",
          name: "NodeName",
          fontSize: 14,
        } as UMLNodeObject);
        break;
      case "uml-database":
        onAdd({
          ...base,
          type: "uml-database",
          name: "Database",
          fontSize: 14,
        } as UMLDatabaseObject);
        break;
      case "uml-package":
        onAdd({
          ...base,
          type: "uml-package",
          name: "PackageName",
          fontSize: 14,
        } as UMLPackageObject);
        break;
      case "uml-note":
        onAdd({
          ...base,
          type: "uml-note",
          text: "Note text here",
          fontSize: 14,
        } as UMLNoteObject);
        break;
      case "uml-boundary":
        onAdd({
          ...base,
          type: "uml-boundary",
          name: "System Boundary",
          fontSize: 14,
        } as UMLBoundaryObject);
        break;
      default:
        onAdd({
          ...base,
          type: "uml-class",
          name: "NewElement",
          attributes: [],
          methods: [],
          compartmentsVisible: true,
          fontSize: 14,
        } as UMLClassObject);
    }
  }, [isDrawing, kind, onAdd, preview, activeColor]);

  return {
    isDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    preview,
  };
}
