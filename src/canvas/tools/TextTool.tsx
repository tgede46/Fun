import { useCallback, useState } from "react";
import type { Camera, TextObject } from "../types";
import { DEFAULT_FILL, DEFAULT_STROKE, DEFAULT_FONT_SIZE } from "../types";

interface UseTextToolProps {
  camera: Camera;
  onAdd: (obj: TextObject) => void;
  activeColor?: string;
}

export function useTextTool({ camera, onAdd, activeColor = DEFAULT_STROKE }: UseTextToolProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (e.button !== 0) return;
      const world = screenToWorld(e.clientX, e.clientY);

      onAdd({
        id: crypto.randomUUID(),
        type: "text",
        x: world.x,
        y: world.y,
        width: 200,
        height: DEFAULT_FONT_SIZE * 1.5,
        fill: activeColor,
        stroke: activeColor,
        strokeWidth: 1,
        opacity: 1,
        locked: false,
        zIndex: 0,
        text: "Texte",
        fontSize: DEFAULT_FONT_SIZE,
      });
    },
    [camera.zoom, activeColor, onAdd],
  );

  const startEditing = useCallback((id: string) => {
    setEditingId(id);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingId(null);
  }, []);

  return {
    editingId,
    handlePointerDown,
    startEditing,
    stopEditing,
  };
}
