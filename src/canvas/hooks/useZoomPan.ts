import { useCallback, useRef, useState } from "react";
import { clamp, MIN_ZOOM, MAX_ZOOM } from "../types";
import type { Camera, FunObject } from "../types";

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

  const zoomToFit = useCallback((objects: FunObject[], containerWidth: number, containerHeight: number) => {
    if (objects.length === 0) {
      setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const obj of objects) {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 50;

    const scaleX = (containerWidth - padding * 2) / contentWidth;
    const scaleY = (containerHeight - padding * 2) / contentHeight;
    const newZoom = clamp(Math.min(scaleX, scaleY), MIN_ZOOM, MAX_ZOOM);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setCamera({
      x: containerWidth / 2 - centerX * newZoom,
      y: containerHeight / 2 - centerY * newZoom,
      zoom: newZoom,
    });
  }, []);

  const centerView = useCallback((containerWidth: number, containerHeight: number) => {
    setCamera({
      x: containerWidth / 2,
      y: containerHeight / 2,
      zoom: 1,
    });
  }, []);

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
    zoomToFit,
    centerView,
  };
}
