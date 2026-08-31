import type { FunObject } from "../types";

interface ShapeRendererProps {
  obj: FunObject & { type: "rect" | "ellipse" | "diamond" };
  selected?: boolean;
}

export function ShapeRenderer({ obj, selected }: ShapeRendererProps) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;

  if (obj.type === "rect") {
    return (
      <g opacity={obj.opacity} data-object-id={obj.id}>
        <rect
          x={obj.x + inset}
          y={obj.y + inset}
          width={Math.max(0, obj.width - strokeWidth)}
          height={Math.max(0, obj.height - strokeWidth)}
          rx={obj.borderRadius}
          ry={obj.borderRadius}
          fill={obj.fill}
          stroke={obj.stroke}
          strokeWidth={strokeWidth}
        />
        {selected && (
          <rect
            x={obj.x - 2}
            y={obj.y - 2}
            width={obj.width + 4}
            height={obj.height + 4}
            rx={obj.borderRadius + 2}
            ry={obj.borderRadius + 2}
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

  if (obj.type === "ellipse") {
    return (
      <g opacity={obj.opacity} data-object-id={obj.id}>
        <ellipse
          cx={obj.x + obj.width / 2}
          cy={obj.y + obj.height / 2}
          rx={Math.max(0, obj.width / 2 - inset)}
          ry={Math.max(0, obj.height / 2 - inset)}
          fill={obj.fill}
          stroke={obj.stroke}
          strokeWidth={strokeWidth}
        />
        {selected && (
          <ellipse
            cx={obj.x + obj.width / 2}
            cy={obj.y + obj.height / 2}
            rx={obj.width / 2 + 2}
            ry={obj.height / 2 + 2}
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

  // diamond
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  const hw = obj.width / 2 - inset;
  const hh = obj.height / 2 - inset;
  const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      <polygon
        points={points}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />
      {selected && (
        <polygon
          points={`${cx},${cy - hh - 3} ${cx + hw + 3},${cy} ${cx},${cy + hh + 3} ${cx - hw - 3},${cy}`}
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
