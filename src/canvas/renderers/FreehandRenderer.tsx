import type { FreehandPath } from "../types";
import { freehandToPathD } from "../utils/freehand";

interface FreehandRendererProps {
  obj: FreehandPath;
  selected?: boolean;
}

export function FreehandRenderer({ obj, selected }: FreehandRendererProps) {
  const d = freehandToPathD(obj.points);
  if (!d) return null;

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      <path
        d={d}
        fill="none"
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="stroke"
      />
      {selected && (
        <path
          d={d}
          fill="none"
          stroke="var(--fun-accent)"
          strokeWidth={obj.strokeWidth + 4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
          pointerEvents="none"
        />
      )}
    </g>
  );
}
