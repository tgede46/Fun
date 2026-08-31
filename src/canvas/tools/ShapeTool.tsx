import { useCallback, useRef, useState } from "react";
import type { Camera, FunObject, ShapeRect, ShapeEllipse, ShapeDiamond } from "../types";
import { DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_STROKE_WIDTH } from "../types";

type ShapeKind = "rect" | "ellipse" | "diamond";

interface UseShapeToolProps {
  camera: Camera;
  onAdd: (obj: FunObject) => void;
  kind: ShapeKind;
  activeColor?: string;
}

export function useShapeTool({ camera, onAdd, kind, activeColor = DEFAULT_STROKE }: UseShapeToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (e.button !== 0) return;
      setIsDrawing(true);
      const world = screenToWorld(e.clientX, e.clientY);
      startRef.current = world;
      currentRef.current = world;
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (!isDrawing) return;
      currentRef.current = screenToWorld(e.clientX, e.clientY);
    },
    [isDrawing],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

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

  const preview = isDrawing
    ? {
        x: Math.min(startRef.current.x, currentRef.current.x),
        y: Math.min(startRef.current.y, currentRef.current.y),
        width: Math.abs(currentRef.current.x - startRef.current.x),
        height: Math.abs(currentRef.current.y - startRef.current.y),
      }
    : null;

  return {
    isDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    preview,
  };
}
