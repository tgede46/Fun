import type { DiagramListItem } from "@/lib/diagram";

type DiagramListProps = {
  diagrams: DiagramListItem[];
  activePath: string | null;
  onSelect: (path: string) => void;
};

export function DiagramList({
  diagrams,
  activePath,
  onSelect,
}: DiagramListProps) {
  if (diagrams.length === 0) {
    return null;
  }

  return (
    <nav className="workshop-diagram-list" aria-label="Diagrammes du projet">
      <span className="workshop-diagram-list__label">Diagrammes</span>
      <ul className="workshop-diagram-list__items">
        {diagrams.map((diagram) => {
          const isActive = diagram.path === activePath;

          return (
            <li key={diagram.path}>
              <button
                type="button"
                className={`workshop-diagram-list__item${
                  isActive ? " workshop-diagram-list__item--active" : ""
                }`}
                onClick={() => onSelect(diagram.path)}
                aria-current={isActive ? "true" : undefined}
              >
                {diagram.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
