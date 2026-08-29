import Link from "next/link";

type ToolbarProps = {
  projectName: string;
  onNewDiagram: () => void;
  isCreatingDiagram: boolean;
};

export function Toolbar({
  projectName,
  onNewDiagram,
  isCreatingDiagram,
}: ToolbarProps) {
  return (
    <header className="workshop-toolbar">
      <div className="workshop-toolbar__start">
        <Link className="workshop-toolbar__back" href="/">
          ← Accueil
        </Link>
        <span className="workshop-toolbar__title">{projectName}</span>
      </div>
      <button
        type="button"
        className="workshop-toolbar__action"
        onClick={onNewDiagram}
        disabled={isCreatingDiagram}
      >
        {isCreatingDiagram ? "Création…" : "Nouveau diagramme"}
      </button>
    </header>
  );
}
