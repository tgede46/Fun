import type { TextObject } from "../types";

interface TextRendererProps {
  obj: TextObject;
  selected?: boolean;
  onDoubleClick?: (id: string) => void;
}

export function TextRenderer({ obj, selected, onDoubleClick }: TextRendererProps) {
  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      {selected && (
        <rect
          x={obj.x - 4}
          y={obj.y - 4}
          width={obj.width + 8}
          height={obj.height + 8}
          fill="none"
          stroke="var(--fun-accent)"
          strokeWidth={2}
          strokeDasharray="6 3"
          pointerEvents="none"
        />
      )}
      <text
        x={obj.x}
        y={obj.y + obj.fontSize}
        fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
        fontSize={obj.fontSize}
        fontFamily="Excalifont, sans-serif"
        pointerEvents="all"
        onDoubleClick={() => onDoubleClick?.(obj.id)}
      >
        {obj.text}
      </text>
    </g>
  );
}
