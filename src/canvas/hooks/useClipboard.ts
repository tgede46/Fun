import { useCallback, useRef } from "react";
import type { FunObject } from "../types";

export function useClipboard() {
  const clipboardRef = useRef<FunObject[]>([]);

  const copy = useCallback((objects: FunObject[]) => {
    clipboardRef.current = objects.map((obj) => ({
      ...obj,
      id: crypto.randomUUID(),
    }));
  }, []);

  const cut = useCallback((objects: FunObject[], deleteObjects: (ids: string[]) => void) => {
    copy(objects);
    deleteObjects(objects.map((o) => o.id));
  }, [copy]);

  const paste = useCallback((offsetX = 20, offsetY = 20): FunObject[] => {
    return clipboardRef.current.map((obj) => ({
      ...obj,
      id: crypto.randomUUID(),
      x: obj.x + offsetX,
      y: obj.y + offsetY,
    }));
  }, []);

  const duplicate = useCallback((objects: FunObject[]): FunObject[] => {
    return objects.map((obj) => ({
      ...obj,
      id: crypto.randomUUID(),
      x: obj.x + 20,
      y: obj.y + 20,
    }));
  }, []);

  const canPaste = clipboardRef.current.length > 0;

  return { copy, cut, paste, duplicate, canPaste };
}