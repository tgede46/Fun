import type { UMLActorObject } from "../types";

export function UMLActorRenderer({ obj, selected }: { obj: UMLActorObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const fontSize = obj.fontSize ?? 14;
  const cx = obj.x + obj.width / 2;
  const headY = obj.y + 12;
  const bodyY = obj.y + obj.height - 4;
  const bodyCenterY = obj.y + obj.height / 2;
  const armLen = obj.width * 0.4;

  return (
    <g opacity={obj.opacity} data-object-id={obj.id} pointerEvents="none">
      {/* Tête (cercle) */}
      <circle cx={cx} cy={headY} r={8} fill="none" stroke={obj.stroke} strokeWidth={strokeWidth} />

      {/* Corps (ligne verticale) */}
      <line
        x1={cx}
        y1={headY + 8}
        x2={cx}
        y2={bodyY}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Bras (deux diagonales) */}
      <line
        x1={cx}
        y1={bodyCenterY}
        x2={cx - armLen}
        y2={bodyCenterY - armLen * 0.5}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />
      <line
        x1={cx}
        y1={bodyCenterY}
        x2={cx + armLen}
        y2={bodyCenterY - armLen * 0.5}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Jambes (deux diagonales) */}
      <line
        x1={cx}
        y1={bodyY}
        x2={cx - armLen * 0.5}
        y2={bodyY + armLen * 0.4}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />
      <line
        x1={cx}
        y1={bodyY}
        x2={cx + armLen * 0.5}
        y2={bodyY + armLen * 0.4}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Nom */}
      <text
        x={obj.x}
        y={obj.y - 6}
        fill={obj.stroke}
        fontSize={fontSize}
        fontFamily="sans-serif"
        textAnchor="middle"
        pointerEvents="none"
      >
        {obj.name || "Actor"}
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
