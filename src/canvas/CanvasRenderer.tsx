import type { FunObject, Camera, UMLCompositionObject, EdgeObject } from "./types";
import { GRID_SIZE } from "./types";
import { FreehandRenderer } from "./renderers/FreehandRenderer";
import { ShapeRenderer } from "./renderers/ShapeRenderer";
import { TextRenderer } from "./renderers/TextRenderer";
import { ArrowRenderer } from "./renderers/ArrowRenderer";
import { ImageRenderer } from "./renderers/ImageRenderer";
import { SnapLines } from "./components/SnapLines";
import { UMLClassRenderer } from "./renderers/UMLClassRenderer";
import { UMLInterfaceRenderer } from "./renderers/UMLInterfaceRenderer";
import { UMLAbstractClassRenderer } from "./renderers/UMLAbstractClassRenderer";
import { UMLEnumRenderer } from "./renderers/UMLEnumRenderer";
import { UMLActorRenderer } from "./renderers/UMLActorRenderer";
import { UMLUseCaseRenderer } from "./renderers/UMLUseCaseRenderer";
import { UMLStateRenderer } from "./renderers/UMLStateRenderer";
import { UMLComponentRenderer } from "./renderers/UMLComponentRenderer";
import { UMLNodeRenderer } from "./renderers/UMLNodeRenderer";
import { UMLDatabaseRenderer } from "./renderers/UMLDatabaseRenderer";
import { UMLPackageRenderer } from "./renderers/UMLPackageRenderer";
import { UMLNoteRenderer } from "./renderers/UMLNoteRenderer";
import { UMLBoundaryRenderer } from "./renderers/UMLBoundaryRenderer";
import { UMLAssociationRenderer } from "./renderers/UMLAssociationRenderer";
import { UMLInheritanceRenderer } from "./renderers/UMLInheritanceRenderer";
import { UMLImplementationRenderer } from "./renderers/UMLImplementationRenderer";
import { UMLAggregationRenderer } from "./renderers/UMLAggregationRenderer";
import { UMLCompositionRenderer } from "./renderers/UMLCompositionRenderer";
import { UMLDependencyRenderer } from "./renderers/UMLDependencyRenderer";
import { UMLNotesLinkRenderer } from "./renderers/UMLNotesLinkRenderer";
import { EdgeRenderer } from "./renderers/EdgeRenderer";

interface CanvasRendererProps {
  objects: FunObject[];
  edges?: EdgeObject[];
  selectedIds: Set<string>;
  selectedEdgeIds?: Set<string>;
  camera: Camera;
  grid: boolean;
  onTextDoubleClick?: (id: string) => void;
  onEdgeSelect?: (id: string) => void;
  snapLines?: { x: number[]; y: number[] };
  edgePreview?: { fromX: number; fromY: number; toX: number; toY: number; kind?: string } | null;
}

function GridPattern({ camera }: { camera: Camera }) {
  const step = GRID_SIZE * camera.zoom;
  if (step < 4) return null;

  const offsetX = camera.x % step;
  const offsetY = camera.y % step;

  return (
    <g pointerEvents="none">
      <defs>
        <pattern
          id="fun-grid"
          width={step}
          height={step}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <circle cx={step / 2} cy={step / 2} r={1} fill="var(--fun-border)" opacity={0.5} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#fun-grid)" />
    </g>
  );
}

function ResizeHandles({
  obj,
  camera,
}: {
  obj: FunObject;
  camera: Camera;
}) {
  if (obj.type === "freehand" || obj.locked) return null;

  const handleSize = 8 / camera.zoom;
  const handles = [
    { cursor: "nw-resize", x: obj.x, y: obj.y },
    { cursor: "n-resize", x: obj.x + obj.width / 2, y: obj.y },
    { cursor: "ne-resize", x: obj.x + obj.width, y: obj.y },
    { cursor: "e-resize", x: obj.x + obj.width, y: obj.y + obj.height / 2 },
    { cursor: "se-resize", x: obj.x + obj.width, y: obj.y + obj.height },
    { cursor: "s-resize", x: obj.x + obj.width / 2, y: obj.y + obj.height },
    { cursor: "sw-resize", x: obj.x, y: obj.y + obj.height },
    { cursor: "w-resize", x: obj.x, y: obj.y + obj.height / 2 },
  ];

  return (
    <g pointerEvents="none">
      {handles.map((h) => (
        <rect
          key={h.cursor}
          x={h.x - handleSize / 2}
          y={h.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="white"
          stroke="var(--fun-accent)"
          strokeWidth={1.5 / camera.zoom}
          rx={2 / camera.zoom}
        />
      ))}
    </g>
  );
}

export function CanvasRenderer({
  objects,
  edges = [],
  selectedIds,
  selectedEdgeIds,
  camera,
  grid,
  onTextDoubleClick,
  onEdgeSelect,
  snapLines,
  edgePreview,
}: CanvasRendererProps) {
  const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  const objectsById = new Map<string, { x: number; y: number; width: number; height: number }>();
  for (const obj of objects) {
    objectsById.set(obj.id, { x: obj.x, y: obj.y, width: obj.width, height: obj.height });
  }

  return (
    <>
      {grid && <GridPattern camera={camera} />}
      <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
        {snapLines && <SnapLines xLines={snapLines.x} yLines={snapLines.y} camera={camera} />}

        {/* Edges */}
        {edges.map((edge) => (
          <EdgeRenderer
            key={edge.id}
            edge={edge}
            objectsById={objectsById}
            selected={selectedEdgeIds?.has(edge.id)}
            onSelect={onEdgeSelect}
          />
        ))}

        {/* Edge preview pendant la création */}
        {edgePreview && (
          <g opacity={0.6}>
            <line
              x1={edgePreview.fromX}
              y1={edgePreview.fromY}
              x2={edgePreview.toX}
              y2={edgePreview.toY}
              stroke="#4f8ff7"
              strokeWidth={2}
              strokeDasharray="6,4"
              strokeLinecap="round"
            />
            <circle cx={edgePreview.fromX} cy={edgePreview.fromY} r={5} fill="#4f8ff7" stroke="white" strokeWidth={1.5} />
            <circle cx={edgePreview.toX} cy={edgePreview.toY} r={5} fill="#4f8ff7" stroke="white" strokeWidth={1.5} />
          </g>
        )}

        {sorted.map((obj) => {
          const selected = selectedIds.has(obj.id);
          switch (obj.type) {
            case "freehand":
              return <FreehandRenderer key={obj.id} obj={obj} selected={selected} />;
            case "rect":
            case "ellipse":
            case "diamond":
              return <ShapeRenderer key={obj.id} obj={obj} selected={selected} />;
            case "text":
              return (
                <TextRenderer
                  key={obj.id}
                  obj={obj}
                  selected={selected}
                  onDoubleClick={onTextDoubleClick}
                />
              );
            case "arrow":
              return <ArrowRenderer key={obj.id} obj={obj} selected={selected} />;
            case "image":
              return <ImageRenderer key={obj.id} obj={obj} selected={selected} />;
            case "uml-class":
              return <UMLClassRenderer key={obj.id} obj={obj as FunObject & { type: "uml-class" }} selected={selected} />;
            case "uml-interface":
              return <UMLInterfaceRenderer key={obj.id} obj={obj as FunObject & { type: "uml-interface" }} selected={selected} />;
            case "uml-abstract-class":
              return <UMLAbstractClassRenderer key={obj.id} obj={obj as FunObject & { type: "uml-abstract-class" }} selected={selected} />;
            case "uml-enum":
              return <UMLEnumRenderer key={obj.id} obj={obj as FunObject & { type: "uml-enum" }} selected={selected} />;
            case "uml-actor":
              return <UMLActorRenderer key={obj.id} obj={obj as FunObject & { type: "uml-actor" }} selected={selected} />;
            case "uml-usecase":
              return <UMLUseCaseRenderer key={obj.id} obj={obj as FunObject & { type: "uml-usecase" }} selected={selected} />;
            case "uml-state":
              return <UMLStateRenderer key={obj.id} obj={obj as FunObject & { type: "uml-state" }} selected={selected} />;
            case "uml-component":
              return <UMLComponentRenderer key={obj.id} obj={obj as FunObject & { type: "uml-component" }} selected={selected} />;
            case "uml-node":
              return <UMLNodeRenderer key={obj.id} obj={obj as FunObject & { type: "uml-node" }} selected={selected} />;
            case "uml-database":
              return <UMLDatabaseRenderer key={obj.id} obj={obj as FunObject & { type: "uml-database" }} selected={selected} />;
            case "uml-package":
              return <UMLPackageRenderer key={obj.id} obj={obj as FunObject & { type: "uml-package" }} selected={selected} />;
            case "uml-note":
              return <UMLNoteRenderer key={obj.id} obj={obj as FunObject & { type: "uml-note" }} selected={selected} />;
            case "uml-boundary":
              return <UMLBoundaryRenderer key={obj.id} obj={obj as FunObject & { type: "uml-boundary" }} selected={selected} />;
            case "uml-association":
              return <UMLAssociationRenderer key={obj.id} obj={obj as FunObject & { type: "uml-association" }} selected={selected} />;
            case "uml-inheritance":
              return <UMLInheritanceRenderer key={obj.id} obj={obj as FunObject & { type: "uml-inheritance" }} selected={selected} />;
            case "uml-implementation":
              return <UMLImplementationRenderer key={obj.id} obj={obj as FunObject & { type: "uml-implementation" }} selected={selected} />;
            case "uml-aggregation":
              return <UMLAggregationRenderer key={obj.id} obj={obj as FunObject & { type: "uml-aggregation" }} selected={selected} />;
            case "uml-composition":
              return <UMLCompositionRenderer key={obj.id} obj={obj as UMLCompositionObject} selected={selected} />;
            case "uml-dependency":
              return <UMLDependencyRenderer key={obj.id} obj={obj as FunObject & { type: "uml-dependency" }} selected={selected} />;
            case "uml-notes-link":
              return <UMLNotesLinkRenderer key={obj.id} obj={obj as FunObject & { type: "uml-notes-link" }} selected={selected} />;
            default:
              return null;
          }
        })}
        {selectedIds.size === 1 && (
          <>
            {sorted
              .filter((o) => selectedIds.has(o.id))
              .map((o) => <ResizeHandles key={`handles-${o.id}`} obj={o} camera={camera} />)}
          </>
        )}
      </g>
    </>
  );
}
