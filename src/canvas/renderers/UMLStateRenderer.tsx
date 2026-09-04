import type { UMLStateObject } from "../types";

export function UMLStateRenderer({ obj, selected }: { obj: UMLStateObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;
  const fontSize = obj.fontSize ?? 14;
  const radius = 10;

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      <rect
        x={obj.x + inset}
        y={obj.y + inset}
        width={Math.max(0, obj.width - strokeWidth)}
        height={Math.max(0, obj.height - strokeWidth)}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
        rx={Math.min(radius, obj.width / 4)}
        ry={Math.min(radius, obj.height / 4)}
      />

      <text
        x={obj.x + obj.width / 2}
        y={obj.y + obj.height / 2}
        fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="sans-serif"
        textAnchor="middle"
        pointerEvents="none"
      >
        {obj.stereotype && <tspan>{obj.stereotype} </tspan>}
        {obj.name || "State"}
      </text>

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
          rx={Math.min(radius, obj.width / 4) + 2}
          ry={Math.min(radius, obj.height / 4) + 2}
        />
      )}
    </g>
  );
}
