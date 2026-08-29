import Link from "next/link";
import type { FunTheme } from "@/lib/theme";

type ToolbarProps = {
  projectName: string;
  theme: FunTheme;
  themeError: string | null;
  onToggleTheme: () => void;
  onNewDiagram: () => void;
  isCreatingDiagram: boolean;
};

export function Toolbar({
  projectName,
  theme,
  themeError,
  onToggleTheme,
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
      <div className="workshop-toolbar__actions">
        {themeError ? (
          <span className="workshop-toolbar__error" role="status">
            {themeError}
          </span>
        ) : null}
        <button
          type="button"
          className="workshop-toolbar__theme"
          onClick={onToggleTheme}
          aria-label={
            theme === "light" ? "Activer le thème sombre" : "Activer le thème clair"
          }
        >
          {theme === "light" ? "Thème sombre" : "Thème clair"}
        </button>
        <button
          type="button"
          className="workshop-toolbar__action"
          onClick={onNewDiagram}
          disabled={isCreatingDiagram}
        >
          {isCreatingDiagram ? "Création…" : "Nouveau diagramme"}
        </button>
      </div>
    </header>
  );
}
