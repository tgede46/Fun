import type { ImageObject } from "../types";

interface ImageRendererProps {
  obj: ImageObject;
  selected?: boolean;
}

export function ImageRenderer({ obj, selected }: ImageRendererProps) {
  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      <image
        href={obj.src}
        x={obj.x}
        y={obj.y}
        width={obj.width}
        height={obj.height}
        preserveAspectRatio="none"
      />
      {selected && (
        <rect
          x={obj.x - 2}
          y={obj.y - 2}
          width={obj.width + 4}
          height={obj.height + 4}
          fill="none"
          stroke="var(--fun-accent)"
          strokeWidth={2}
          strokeDasharray="6 3"
          pointerEvents="none"
        />
      )}
    </g>
  );
}