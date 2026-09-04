import type { UMLBoundaryObject } from "../types";

export function UMLBoundaryRenderer({ obj, selected }: { obj: UMLBoundaryObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;
  const fontSize = obj.fontSize ?? 14;
  const dashArray = `8 4`;

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      <rect
        x={obj.x + inset}
        y={obj.y + inset}
        width={Math.max(0, obj.width - strokeWidth)}
        height={Math.max(0, obj.height - strokeWidth)}
        fill="none"
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
      />

      <text
        x={obj.x + obj.width / 2}
        y={obj.y - 6}
        fill={obj.stroke}
        fontSize={fontSize}
        fontFamily="sans-serif"
        textAnchor="middle"
        fontStyle="italic"
        pointerEvents="none"
      >
        {obj.name}
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
        />
      )}
    </g>
  );
}
