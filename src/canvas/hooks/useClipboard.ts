import { useCallback, useRef, useState } from "react";
import type { FunObject } from "../types";

export function useClipboard() {
  const clipboardRef = useRef<FunObject[]>([]);
  const [canPaste, setCanPaste] = useState(false);

  const copy = useCallback((objects: FunObject[]) => {
    clipboardRef.current = objects.map((obj) => ({
      ...obj,
      id: crypto.randomUUID(),
    }));
    setCanPaste(objects.length > 0);
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

  return { copy, cut, paste, duplicate, canPaste };
}