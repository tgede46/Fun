import Link from "next/link";
import type { FunTheme } from "@/lib/theme";
import type { WorkshopMode } from "./ModeRail";
import { ThemeToggle } from "./ThemeToggle";

type ToolbarProps = {
  projectName: string;
  theme: FunTheme;
  themeError: string | null;
  mode: WorkshopMode;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onToggleTheme: () => void;
  onNewDiagram: () => void;
  onGenerateFromCode: () => void;
  isCreatingDiagram: boolean;
  isGeneratingFromCode: boolean;
  canDeleteDiagram?: boolean;
  isDeletingDiagram?: boolean;
  onDeleteDiagram?: () => void;
  projectPath: string;
};

export function Toolbar({
  projectName,
  theme,
  themeError,
  mode,
  focusMode,
  onToggleFocusMode,
  onToggleTheme,
  onNewDiagram,
  onGenerateFromCode,
  isCreatingDiagram,
  isGeneratingFromCode,
  canDeleteDiagram = false,
  isDeletingDiagram = false,
  onDeleteDiagram,
  projectPath,
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
        {mode === "sketch" ? (
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              focusMode
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            onClick={onToggleFocusMode}
            title="Masquer calques et propriétés pour se concentrer sur le dessin"
            aria-pressed={focusMode}
          >
            {focusMode ? "Focus actif" : "Focus"}
          </button>
        ) : null}
        {themeError ? (
          <span className="text-xs text-destructive" role="status">
            {themeError}
          </span>
        ) : null}
        <ThemeToggle
          theme={theme}
          onToggle={onToggleTheme}
          projectPath={projectPath}
        />
        {/* Boutons disponibles dans les deux modes */}
        <button
          type="button"
          className="px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          onClick={onGenerateFromCode}
          disabled={isGeneratingFromCode}
          title="Scanne les fichiers source du projet et génère un diagramme via l'IA"
        >
          {isGeneratingFromCode ? "Analyse du code…" : "Depuis le code"}
        </button>
        {canDeleteDiagram && (
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            onClick={onDeleteDiagram}
            disabled={isDeletingDiagram}
            title="Supprimer le diagramme ouvert (.fun/diagrams/)"
          >
            {isDeletingDiagram ? "Suppression…" : "Supprimer"}
          </button>
        )}
        <button
          type="button"
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          onClick={onNewDiagram}
          disabled={isCreatingDiagram}
          title={mode === "uml" ? "Crée un nouveau fichier diagramme UML vide dans .fun/diagrams/" : "Crée un fichier .excalidraw vide dans .fun/diagrams/"}
        >
          {isCreatingDiagram ? "Création…" : mode === "uml" ? "Nouveau UML" : "Nouveau diagramme"}
        </button>
      </div>
    </header>
  );
}
