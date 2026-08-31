import { useCallback, useRef, useState } from "react";
import type { FunObject, BBox } from "../types";
import { bboxesOverlap, objectBBox } from "../utils/geometry";

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedRef = useRef<string | null>(null);

  const select = useCallback((id: string, additive = false) => {
    if (additive) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  }, []);

  const selectOnly = useCallback((id: string) => {
    setSelectedIds(new Set([id]));
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const selectInRect = useCallback((rect: BBox, objects: FunObject[]) => {
    const matches = objects.filter((obj) => {
      if (obj.locked) return false;
      const bbox = objectBBox(obj);
      return bboxesOverlap(rect, bbox);
    });
    setSelectedIds(new Set(matches.map((o) => o.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedRef.current = null;
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    select,
    selectOnly,
    selectMultiple,
    selectInRect,
    clearSelection,
    isSelected,
    setSelectedIds,
  };
}
