import type { UMLEnumObject } from "../types";

export function UMLEnumRenderer({ obj, selected }: { obj: UMLEnumObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;
  const fontSize = obj.fontSize ?? 14;

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
      />

      <line
        x1={obj.x + inset}
        y1={obj.y + fontSize + 4}
        x2={obj.x + obj.width - inset}
        y2={obj.y + fontSize + 4}
        stroke={obj.stroke}
        strokeWidth={strokeWidth * 0.5}
      />

      <text
        x={obj.x + 6}
        y={obj.y + fontSize + 4}
        fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="sans-serif"
        pointerEvents="none"
      >
        {obj.name}
      </text>

      {obj.values?.map((value, i) => (
        <text
          key={`val-${i}`}
          x={obj.x + 6}
          y={obj.y + 24 + i * (fontSize + 2)}
          fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
          fontSize={fontSize - 2}
          fontFamily="monospace"
          pointerEvents="none"
        >
          {value}
        </text>
      ))}

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
