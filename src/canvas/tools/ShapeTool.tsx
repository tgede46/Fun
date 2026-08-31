import { useCallback, useRef, useState } from "react";
import type { Camera, FunObject, ShapeRect, ShapeEllipse, ShapeDiamond } from "../types";
import { DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_STROKE_WIDTH } from "../types";

type ShapeKind = "rect" | "ellipse" | "diamond";

interface ShapePreview {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseShapeToolProps {
  camera: Camera;
  onAdd: (obj: FunObject) => void;
  kind: ShapeKind;
  activeColor?: string;
}

export function useShapeTool({ onAdd, kind, activeColor = DEFAULT_STROKE }: UseShapeToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [preview, setPreview] = useState<ShapePreview | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (e.button !== 0) return;
      setIsDrawing(true);
      const world = screenToWorld(e.clientX, e.clientY);
      startRef.current = world;
      currentRef.current = world;
      setPreview({ x: world.x, y: world.y, width: 0, height: 0 });
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (!isDrawing) return;
      const world = screenToWorld(e.clientX, e.clientY);
      currentRef.current = world;
      const sx = Math.min(startRef.current.x, world.x);
      const sy = Math.min(startRef.current.y, world.y);
      setPreview({ x: sx, y: sy, width: Math.abs(world.x - startRef.current.x), height: Math.abs(world.y - startRef.current.y) });
    },
    [isDrawing],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setPreview(null);

    const sx = Math.min(startRef.current.x, currentRef.current.x);
    const sy = Math.min(startRef.current.y, currentRef.current.y);
    const ex = Math.max(startRef.current.x, currentRef.current.x);
    const ey = Math.max(startRef.current.y, currentRef.current.y);
    const w = ex - sx;
    const h = ey - sy;

    if (w < 4 && h < 4) return;

    const base = {
      id: crypto.randomUUID(),
      x: sx,
      y: sy,
      width: w,
      height: h,
      fill: DEFAULT_FILL,
      stroke: activeColor,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      opacity: 1,
      locked: false,
      zIndex: 0,
    };

    if (kind === "rect") {
      onAdd({ ...base, type: "rect", borderRadius: 0 } as ShapeRect);
    } else if (kind === "ellipse") {
      onAdd({ ...base, type: "ellipse" } as ShapeEllipse);
    } else {
      onAdd({ ...base, type: "diamond" } as ShapeDiamond);
    }
  }, [isDrawing, kind, activeColor, onAdd]);

  return {
    isDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    preview,
  };
}
