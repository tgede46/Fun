import type { UMLComponentObject } from "../types";

export function UMLComponentRenderer({ obj, selected }: { obj: UMLComponentObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;
  const fontSize = obj.fontSize ?? 14;
  const tabHeight = 10;

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      {/* Corps du composant */}
      <rect
        x={obj.x + inset}
        y={obj.y + inset + tabHeight}
        width={Math.max(0, obj.width - strokeWidth)}
        height={Math.max(0, obj.height - strokeWidth - tabHeight)}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Onglet supérieur (stéréotype) */}
      <path
        d={`M ${obj.x + inset} ${obj.y + inset + tabHeight} L ${obj.x + inset} ${obj.y + inset} L ${obj.x + inset + 20} ${obj.y + inset} L ${obj.x + inset + 25 + (obj.stereotype?.length ?? 0) * 7} ${obj.y + inset + tabHeight}`}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Nom */}
      <text
        x={obj.x + inset + 5}
        y={obj.y + inset + 8}
        fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="monospace"
        pointerEvents="none"
      >
        {obj.stereotype && <tspan>{obj.stereotype} </tspan>}
        {obj.name}
      </text>

      {/* Interface points (petits rectangles sur les côtés) */}
      <rect
        x={obj.x + inset + 4}
        y={obj.y + inset + tabHeight + 6}
        width={4}
        height={4}
        fill={obj.stroke}
        stroke="none"
      />
      <rect
        x={obj.x + obj.width - inset - 8}
        y={obj.y + inset + tabHeight + 6}
        width={4}
        height={4}
        fill={obj.stroke}
        stroke="none"
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
