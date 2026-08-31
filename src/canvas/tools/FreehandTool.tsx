import { useCallback, useRef, useState } from "react";
import type { Camera, FreehandPath } from "../types";
import { DEFAULT_STROKE, DEFAULT_STROKE_WIDTH } from "../types";
import { smoothFreehand } from "../utils/freehand";

interface UseFreehandToolProps {
  camera: Camera;
  onAdd: (obj: FreehandPath) => void;
  activeColor?: string;
}

export function useFreehandTool({ camera, onAdd, activeColor = DEFAULT_STROKE }: UseFreehandToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (e.button !== 0) return;
      setIsDrawing(true);
      const world = screenToWorld(e.clientX, e.clientY);
      pointsRef.current = [world];
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (!isDrawing) return;
      const world = screenToWorld(e.clientX, e.clientY);
      pointsRef.current.push(world);
    },
    [isDrawing],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const raw = pointsRef.current;
    pointsRef.current = [];

    if (raw.length < 2) return;

    const smoothed = smoothFreehand(raw, 2 / camera.zoom);

    let minX = Infinity, minY = Infinity;
    for (const p of smoothed) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
    }

    onAdd({
      id: crypto.randomUUID(),
      type: "freehand",
      x: minX,
      y: minY,
      width: 0,
      height: 0,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      opacity: 1,
      locked: false,
      zIndex: 0,
      points: smoothed,
    });
  }, [isDrawing, camera.zoom, activeColor, onAdd]);

  const previewPoints = isDrawing ? pointsRef.current : null;

  return {
    isDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    previewPoints,
  };
}
