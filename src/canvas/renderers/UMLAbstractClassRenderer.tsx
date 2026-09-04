import type { UMLAbstractClassObject } from "../types";

export function UMLAbstractClassRenderer({ obj, selected }: { obj: UMLAbstractClassObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;
  const fontSize = obj.fontSize ?? 14;
  const italicFont = "italic 14px sans-serif";

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

      <text
        x={obj.x + 6}
        y={obj.y + fontSize + 4}
        fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
        fontSize={fontSize}
        fontWeight="bold"
        fontStyle="italic"
        fontFamily="sans-serif"
        pointerEvents="none"
      >
        {obj.stereotype && <tspan>{obj.stereotype} </tspan>}
        {obj.name}
      </text>

      {obj.attributes?.map((attr, i) => (
        <text
          key={`attr-${i}`}
          x={obj.x + 6}
          y={obj.y + 24 + (i + 1) * (fontSize + 2)}
          fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
          fontSize={fontSize - 2}
          fontFamily="monospace"
          pointerEvents="none"
        >
          {attr}
        </text>
      ))}

      {obj.methods?.map((method, i) => (
        <text
          key={`meth-${i}`}
          x={obj.x + 6}
          y={obj.y + 24 + ((obj.attributes?.length ?? 0) + 1 + i) * (fontSize + 2)}
          fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
          fontSize={fontSize - 2}
          fontFamily="monospace"
          pointerEvents="none"
        >
          {method}
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
