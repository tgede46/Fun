import { useCallback, useRef, useState } from "react";
import { clamp, MIN_ZOOM, MAX_ZOOM } from "../types";
import type { Camera } from "../types";

export function useZoomPan(initial?: Partial<Camera>) {
  const [camera, setCamera] = useState<Camera>({
    x: initial?.x ?? 0,
    y: initial?.y ?? 0,
    zoom: initial?.zoom ?? 1,
  });
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const zoom = useCallback((delta: number, pivotX: number, pivotY: number) => {
    setCamera((prev) => {
      const factor = delta > 0 ? 0.9 : 1.1;
      const newZoom = clamp(prev.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      const scale = newZoom / prev.zoom;
      const newX = pivotX - (pivotX - prev.x) * scale;
      const newY = pivotY - (pivotY - prev.y) * scale;
      return { x: newX, y: newY, zoom: newZoom };
    });
  }, []);

  const panStart = useCallback((clientX: number, clientY: number) => {
    isPanningRef.current = true;
    lastMouseRef.current = { x: clientX, y: clientY };
  }, []);

  const panMove = useCallback((clientX: number, clientY: number) => {
    if (!isPanningRef.current) return;
    const dx = clientX - lastMouseRef.current.x;
    const dy = clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: clientX, y: clientY };
    setCamera((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const panEnd = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  const resetCamera = useCallback(() => {
    setCamera({ x: 0, y: 0, zoom: 1 });
  }, []);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      return {
        x: (sx - camera.x) / camera.zoom,
        y: (sy - camera.y) / camera.zoom,
      };
    },
    [camera],
  );

  const worldToScreen = useCallback(
    (wx: number, wy: number) => {
      return {
        x: wx * camera.zoom + camera.x,
        y: wy * camera.zoom + camera.y,
      };
    },
    [camera],
  );

  return {
    camera,
    setCamera,
    zoom,
    panStart,
    panMove,
    panEnd,
    resetCamera,
    screenToWorld,
    worldToScreen,
  };
}
