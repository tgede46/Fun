import Link from "next/link";
import type { FunTheme } from "@/lib/theme";

type WorkshopMode = "sketch" | "uml";

type ToolbarProps = {
  projectName: string;
  theme: FunTheme;
  themeError: string | null;
  mode: WorkshopMode;
  onToggleTheme: () => void;
  onNewDiagram: () => void;
  onGenerateFromCode: () => void;
  isCreatingDiagram: boolean;
  isGeneratingFromCode: boolean;
};

export function Toolbar({
  projectName,
  theme,
  themeError,
  mode,
  onToggleTheme,
  onNewDiagram,
  onGenerateFromCode,
  isCreatingDiagram,
  isGeneratingFromCode,
}: ToolbarProps) {
  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <Link
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          href="/"
        >
          ← Accueil
        </Link>
        <span className="font-semibold text-foreground">{projectName}</span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary">
          {mode === "uml" ? "◫ UML" : "✎ Sketch"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {themeError ? (
          <span className="text-xs text-destructive" role="status">
            {themeError}
          </span>
        ) : null}
        <button
          type="button"
          className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          onClick={onToggleTheme}
          aria-label={
            theme === "light" ? "Activer le thème sombre" : "Activer le thème clair"
          }
        >
          {theme === "light" ? "Thème sombre" : "Thème clair"}
        </button>
        {mode === "sketch" ? (
          <>
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              onClick={onGenerateFromCode}
              disabled={isGeneratingFromCode}
              title="Scanne les fichiers source du projet et génère un diagramme Excalidraw via l'IA"
            >
              {isGeneratingFromCode ? "Analyse du code…" : "Depuis le code"}
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              onClick={onNewDiagram}
              disabled={isCreatingDiagram}
              title="Crée un fichier .excalidraw vide dans .fun/diagrams/"
            >
              {isCreatingDiagram ? "Création…" : "Nouveau diagramme"}
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
