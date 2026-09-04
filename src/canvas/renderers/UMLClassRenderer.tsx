import type { UMLClassObject } from "../types";

function compartmentY(baseY: number, index: number, fontSize: number): number {
  return baseY + index * (fontSize + 4);
}

export function UMLClassRenderer({ obj, selected }: { obj: UMLClassObject; selected?: boolean }) {
  const strokeWidth = obj.strokeWidth;
  const inset = strokeWidth / 2;
  const fontSize = obj.fontSize ?? 14;
  const nameHeight = fontSize + 6;
  const attrHeight = (obj.attributes?.length ?? 0) * (fontSize + 4);
  const methHeight = (obj.methods?.length ?? 0) * (fontSize + 4);
  const totalHeight = nameHeight + attrHeight + methHeight;

  return (
    <g opacity={obj.opacity} data-object-id={obj.id}>
      {/* Boîte principale */}
      <rect
        x={obj.x + inset}
        y={obj.y + inset}
        width={Math.max(0, obj.width - strokeWidth)}
        height={Math.max(0, totalHeight - strokeWidth)}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={strokeWidth}
      />

      {/* Séparateurs entre compartments */}
      {obj.compartmentsVisible !== false && (
        <>
          {obj.attributes.length > 0 && (
            <line
              x1={obj.x + inset}
              y1={obj.y + nameHeight}
              x2={obj.x + obj.width - inset}
              y2={obj.y + nameHeight}
              stroke={obj.stroke}
              strokeWidth={strokeWidth * 0.5}
            />
          )}
          {obj.methods.length > 0 && (
            <line
              x1={obj.x + inset}
              y1={obj.y + nameHeight + attrHeight}
              x2={obj.x + obj.width - inset}
              y2={obj.y + nameHeight + attrHeight}
              stroke={obj.stroke}
              strokeWidth={strokeWidth * 0.5}
            />
          )}
        </>
      )}

      {/* Nom (compartment 1) */}
      <text
        x={obj.x + 6}
        y={obj.y + nameHeight - 4}
        fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="sans-serif"
        pointerEvents="none"
      >
        {obj.stereotype && <tspan>{obj.stereotype}</tspan>}
        {obj.stereotype && <tspan x={obj.x + 6} dy={fontSize + 2}>{obj.name}</tspan>}
        {!obj.stereotype && obj.name}
      </text>

      {/* Attributs (compartment 2) */}
      {obj.compartmentsVisible !== false &&
        obj.attributes?.map((attr, i) => (
          <text
            key={`attr-${i}`}
            x={obj.x + 6}
            y={compartmentY(obj.y, i + 1, fontSize)}
            fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
            fontSize={fontSize - 2}
            fontFamily="monospace"
            pointerEvents="none"
          >
            {attr}
          </text>
        ))}

      {/* Méthodes (compartment 3) */}
      {obj.compartmentsVisible !== false &&
        obj.methods?.map((method, i) => (
          <text
            key={`meth-${i}`}
            x={obj.x + 6}
            y={compartmentY(obj.y, i + 1 + (obj.attributes?.length ?? 0), fontSize)}
            fill={obj.fill === "transparent" ? obj.stroke : obj.fill}
            fontSize={fontSize - 2}
            fontFamily="monospace"
            pointerEvents="none"
          >
            {method}
          </text>
        ))}

      {/* Selection */}
      {selected && (
        <rect
          x={obj.x - 2}
          y={obj.y - 2}
          width={obj.width + 4}
          height={totalHeight + 4}
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
