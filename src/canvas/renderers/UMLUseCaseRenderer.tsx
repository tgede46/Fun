import type { UMLUseCaseObject } from "../types";

export function UMLUseCaseRenderer({ obj, selected }: { obj: UMLUseCaseObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const fontSize = obj.fontSize ?? 14;
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  const rx = obj.width / 2 - strokeWidth / 2;
  const ry = obj.height / 2 - strokeWidth / 2;

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      {/* Ovale (use case) */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={Math.max(0, rx)}
        ry={Math.max(0, ry)}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Nom */}
      <text
        x={cx}
        y={cy - fontSize / 3}
        fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="sans-serif"
        textAnchor="middle"
        pointerEvents="none"
      >
        {obj.name || "Use Case"}
      </text>

      {selected && (
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx + 2}
          ry={ry + 2}
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
