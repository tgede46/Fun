import type { UMLPackageObject } from "../types";

export function UMLPackageRenderer({ obj, selected }: { obj: UMLPackageObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;
  const fontSize = obj.fontSize ?? 14;
  const tabWidth = 20;
  const tabHeight = 8;

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      {/* Rectangle principal */}
      <rect
        x={obj.x + inset}
        y={obj.y + inset}
        width={Math.max(0, obj.width - strokeWidth)}
        height={Math.max(0, obj.height - strokeWidth)}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Onglet supérieur (package) */}
      <path
        d={`M ${obj.x + inset} ${obj.y + inset} L ${obj.x + inset} ${obj.y + inset - tabHeight} L ${obj.x + inset + tabWidth} ${obj.y + inset - tabHeight} L ${obj.x + inset + tabWidth} ${obj.y + inset + tabHeight} Z`}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      <text
        x={obj.x + inset + 5}
        y={obj.y + inset + 10 + tabHeight}
        fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="sans-serif"
        pointerEvents="none"
      >
        {obj.name || "Package"}
      </text>

      {selected && (
        <rect
          x={obj.x - 2}
          y={obj.y - tabHeight - 2}
          width={obj.width + 4}
          height={obj.height + tabHeight + 4}
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
