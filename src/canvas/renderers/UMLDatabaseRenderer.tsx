import type { UMLDatabaseObject } from "../types";

export function UMLDatabaseRenderer({ obj, selected }: { obj: UMLDatabaseObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;
  const fontSize = obj.fontSize ?? 14;
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;

  // Cylindre simplifié
  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      {/* Corps du cylindre */}
      <path
        d={`M ${obj.x + inset} ${obj.y + inset} 
             L ${obj.x + inset} ${obj.y + obj.height - inset} 
             A ${obj.width / 2 - inset} ${obj.height / 2 - inset} 0 0 1 ${obj.x + obj.width - inset} ${obj.y + obj.height - inset}
             L ${obj.x + obj.width - inset} ${obj.y + inset}
             A ${obj.width / 2 - inset} ${obj.height / 2 - inset} 0 0 1 ${obj.x + inset} ${obj.y + inset} Z`}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Disque haut */}
      <ellipse
        cx={cx}
        cy={obj.y + inset}
        rx={Math.max(0, obj.width / 2 - inset)}
        ry={Math.max(0, obj.height / 4 - inset)}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth * 0.5}
      />

      <text
        x={cx}
        y={cy}
        fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="sans-serif"
        textAnchor="middle"
        pointerEvents="none"
      >
        {obj.name || "Database"}
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
          rx={10}
          ry={10}
        />
      )}
    </g>
  );
}
