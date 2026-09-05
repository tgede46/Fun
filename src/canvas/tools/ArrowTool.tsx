import { useCallback, useRef, useState } from "react";
import type { Camera, ArrowObject } from "../types";
import { DEFAULT_STROKE, DEFAULT_STROKE_WIDTH } from "../types";

interface UseArrowToolProps {
  camera?: Camera;
  onAdd: (obj: ArrowObject) => void;
  activeColor?: string;
}

export function useArrowTool({ onAdd, activeColor = DEFAULT_STROKE }: UseArrowToolProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewPoints, setPreviewPoints] = useState<{ x: number; y: number }[] | null>(null);
  const startRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (e.button !== 0) return;
      setIsDrawing(true);
      const world = screenToWorld(e.clientX, e.clientY);
      startRef.current = world;
      setPreviewPoints([world, world]);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (!isDrawing) return;
      const world = screenToWorld(e.clientX, e.clientY);
      setPreviewPoints([startRef.current, world]);
    },
    [isDrawing],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setPreviewPoints(null);

    const start = startRef.current;
    const end = previewPoints?.[1] ?? start;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 5) return;

    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);

    onAdd({
      id: crypto.randomUUID(),
      type: "arrow",
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      opacity: 1,
      locked: false,
      zIndex: 0,
      points: [start, end],
      arrowHead: "triangle",
    });
  }, [isDrawing, previewPoints, activeColor, onAdd]);

  return {
    isDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    previewPoints,
  };
}