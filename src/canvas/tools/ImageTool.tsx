import { useCallback, useState } from "react";
import type { ImageObject } from "../types";

interface UseImageToolProps {
  onAdd: (obj: ImageObject) => void;
}

export function useImageTool({ onAdd }: UseImageToolProps) {
  const [isLoading, setIsLoading] = useState(false);

  const importImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;

      setIsLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const maxSize = 400;
            let width = img.naturalWidth;
            let height = img.naturalHeight;

            if (width > maxSize || height > maxSize) {
              const scale = maxSize / Math.max(width, height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }

            onAdd({
              id: crypto.randomUUID(),
              type: "image",
              x: 100,
              y: 100,
              width,
              height,
              fill: "transparent",
              stroke: "transparent",
              strokeWidth: 0,
              opacity: 1,
              locked: false,
              zIndex: 0,
              src,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
            });
            setIsLoading(false);
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      } catch {
        setIsLoading(false);
      }
    },
    [onAdd],
  );

  const handleFileInput = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) importImage(file);
    };
    input.click();
  }, [importImage]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) importImage(file);
    },
    [importImage],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return {
    isLoading,
    importImage,
    handleFileInput,
    handleDrop,
    handleDragOver,
  };
}