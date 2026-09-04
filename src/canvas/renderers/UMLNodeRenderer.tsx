import type { UMLNodeObject } from "../types";

export function UMLNodeRenderer({ obj, selected }: { obj: UMLNodeObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;
  const fontSize = obj.fontSize ?? 14;
  const depth = 6;

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      {/* Face avant */}
      <rect
        x={obj.x + inset}
        y={obj.y + inset}
        width={Math.max(0, obj.width - strokeWidth)}
        height={Math.max(0, obj.height - strokeWidth)}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Faces 3D (légère) */}
      <path
        d={`M ${obj.x + obj.width} ${obj.y + inset} L ${obj.x + obj.width + depth} ${obj.y + inset + depth} L ${obj.x + obj.width + depth} ${obj.y + obj.height + inset + depth} L ${obj.x + obj.width} ${obj.y + obj.height + inset}`}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth * 0.5}
        opacity={0.6}
      />
      <path
        d={`M ${obj.x} ${obj.y + obj.height + inset} L ${obj.x + depth} ${obj.y + obj.height + inset + depth} L ${obj.x + obj.width + depth} ${obj.y + obj.height + inset + depth} L ${obj.x + obj.width} ${obj.y + obj.height + inset}`}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth * 0.5}
        opacity={0.6}
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
        {obj.name || "Node"}
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
