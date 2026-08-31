import { useCallback, useRef, useState } from "react";
import type { Camera, FunObject, BBox } from "../types";
import { pointInObject, objectBBox, resizeBBox } from "../utils/geometry";
import { snapObject } from "../utils/snap";
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
  onSnapLines?: (lines: { x: number[]; y: number[] }) => void;
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
  onSnapLines,
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
        if (selectedObj && !selectedObj.locked && selectedObj.type !== "freehand") {
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
          if (obj && !obj.locked) starts.set(id, { x: obj.x, y: obj.y });
        }
        if (starts.size === 0) {
          setIsDragging(false);
          return;
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
        
        let allSnapX: number[] = [];
        let allSnapY: number[] = [];

        for (const [id, start] of dragObjStartsRef.current) {
          const obj = objects.find((o) => o.id === id);
          if (!obj || obj.locked) continue;

          const newX = start.x + dx;
          const newY = start.y + dy;
          
          const snapResult = snapObject(
            { ...obj, x: newX, y: newY },
            objects.filter((o) => !selectedIds.has(o.id)),
            camera,
          );

          if (snapResult.snapLineX !== undefined) allSnapX.push(snapResult.snapLineX);
          if (snapResult.snapLineY !== undefined) allSnapY.push(snapResult.snapLineY);

          onUpdate(id, {
            x: snapResult.x !== null ? snapResult.x : newX,
            y: snapResult.y !== null ? snapResult.y : newY,
          });
        }

        onSnapLines?.({ x: [...new Set(allSnapX)], y: [...new Set(allSnapY)] });
      }

      if (isResizing && resizeHandleRef.current && resizeObjStartRef.current) {
        const dx = world.x - resizeStartRef.current.x;
        const dy = world.y - resizeStartRef.current.y;
        const bbox = resizeBBox(resizeObjStartRef.current, resizeHandleRef.current, dx, dy);
        const selectedObj = objects.find((o) => selectedIds.has(o.id));
        if (selectedObj && !selectedObj.locked) {
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
    onSnapLines?.({ x: [], y: [] });
  }, [isMarquee, marqueeRect, selectInRect, objects, onSnapLines]);

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
