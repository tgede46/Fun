import { useCallback, useRef, useState } from "react";
import type { Camera, FunObject, BBox } from "../types";
import { pointInObject, objectBBox, resizeBBox, clamp } from "../utils/geometry";
import type { ResizeHandle } from "../types";

interface UseSelectionToolProps {
  camera: Camera;
  objects: FunObject[];
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  onSelectOnly: (id: string) => void;
  selectInRect: (rect: BBox, objects: FunObject[]) => void;
  clearSelection: () => void;
  onUpdate: (id: string, patch: Partial<FunObject>) => void;
}

export function useSelectionTool({
  camera,
  objects,
  selectedIds,
  onSelect,
  onSelectOnly,
  selectInRect,
  clearSelection,
  onUpdate,
}: UseSelectionToolProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMarquee, setIsMarquee] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragObjStartsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const resizeHandleRef = useRef<ResizeHandle | null>(null);
  const resizeStartRef = useRef({ x: 0, y: 0 });
  const resizeObjStartRef = useRef<BBox | null>(null);
  const marqueeStartRef = useRef({ x: 0, y: 0 });
  const [marqueeRect, setMarqueeRect] = useState<BBox | null>(null);

  const handlePointerDown = useCallback(
    (
      e: React.PointerEvent,
      screenToWorld: (sx: number, sy: number) => { x: number; y: number },
      hitResizeHandle: (sx: number, sy: number) => ResizeHandle | null,
    ) => {
      if (e.button !== 0) return;
      const world = screenToWorld(e.clientX, e.clientY);

      const handle = hitResizeHandle(e.clientX, e.clientY);
      if (handle && selectedIds.size === 1) {
        const selectedObj = objects.find((o) => selectedIds.has(o.id));
        if (selectedObj && selectedObj.type !== "freehand") {
          setIsResizing(true);
          resizeHandleRef.current = handle;
          resizeStartRef.current = world;
          resizeObjStartRef.current = objectBBox(selectedObj);
          return;
        }
      }

      const clickedObj = [...objects].reverse().find((obj) => {
        if (obj.locked) return false;
        return pointInObject(world.x, world.y, obj);
      });

      if (clickedObj) {
        if (selectedIds.has(clickedObj.id)) {
          onSelect(clickedObj.id, true);
        } else {
          onSelectOnly(clickedObj.id);
        }
        setIsDragging(true);
        dragStartRef.current = world;
        const starts = new Map<string, { x: number; y: number }>();
        const ids = selectedIds.has(clickedObj.id) ? selectedIds : new Set([clickedObj.id]);
        for (const id of ids) {
          const obj = objects.find((o) => o.id === id);
          if (obj) starts.set(id, { x: obj.x, y: obj.y });
        }
        dragObjStartsRef.current = starts;
      } else {
        clearSelection();
        setIsMarquee(true);
        marqueeStartRef.current = world;
        setMarqueeRect(null);
      }
    },
    [objects, selectedIds, onSelect, onSelectOnly, clearSelection],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, screenToWorld: (sx: number, sy: number) => { x: number; y: number }) => {
      if (!isDragging && !isResizing && !isMarquee) return;
      const world = screenToWorld(e.clientX, e.clientY);

      if (isDragging) {
        const dx = world.x - dragStartRef.current.x;
        const dy = world.y - dragStartRef.current.y;
        for (const [id, start] of dragObjStartsRef.current) {
          onUpdate(id, { x: start.x + dx, y: start.y + dy });
        }
      }

      if (isResizing && resizeHandleRef.current && resizeObjStartRef.current) {
        const dx = world.x - resizeStartRef.current.x;
        const dy = world.y - resizeStartRef.current.y;
        const bbox = resizeBBox(resizeObjStartRef.current, resizeHandleRef.current, dx, dy);
        const selectedObj = objects.find((o) => selectedIds.has(o.id));
        if (selectedObj) {
          onUpdate(selectedObj.id, {
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
          });
        }
      }

      if (isMarquee) {
        const sx = Math.min(marqueeStartRef.current.x, world.x);
        const sy = Math.min(marqueeStartRef.current.y, world.y);
        const ex = Math.max(marqueeStartRef.current.x, world.x);
        const ey = Math.max(marqueeStartRef.current.y, world.y);
        setMarqueeRect({ x: sx, y: sy, width: ex - sx, height: ey - sy });
      }
    },
    [isDragging, isResizing, isMarquee, objects, selectedIds, onUpdate],
  );

  const handlePointerUp = useCallback(() => {
    if (isMarquee && marqueeRect) {
      selectInRect(marqueeRect, objects);
    }
    setIsDragging(false);
    setIsResizing(false);
    setIsMarquee(false);
    setMarqueeRect(null);
    dragObjStartsRef.current.clear();
  }, [isMarquee, marqueeRect, selectInRect, objects]);

  return {
    isDragging,
    isResizing,
    isMarquee,
    marqueeRect,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
