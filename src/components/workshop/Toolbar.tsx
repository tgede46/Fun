import Link from "next/link";
import type { FunTheme } from "@/lib/theme";
import type { WorkshopMode } from "./ModeRail";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  onGenerateFromImage: () => void;
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
  onGenerateFromImage,
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
        <Badge variant="secondary">
          {mode === "uml" ? "◫ UML" : mode === "plantuml" ? "{ } PlantUML" : "✎ Excalidraw"}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {mode !== "uml" ? (
          <Button
            variant={focusMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleFocusMode}
            title="Masquer calques et propriétés pour se concentrer sur le dessin"
            aria-pressed={focusMode}
          >
            {focusMode ? "Focus actif" : "Focus"}
          </Button>
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
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateFromCode}
          disabled={isGeneratingFromCode}
          title="Scanne les fichiers source du projet et génère un diagramme via l'IA"
        >
          {isGeneratingFromCode ? "Analyse du code…" : "Depuis le code"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateFromImage}
          disabled={isGeneratingFromCode}
          title="Importer une capture ou une image et générer un diagramme"
        >
          Depuis une image
        </Button>
        {canDeleteDiagram && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteDiagram}
            disabled={isDeletingDiagram}
            title="Supprimer le diagramme ouvert (.fun/diagrams/)"
          >
            {isDeletingDiagram ? "Suppression…" : "Supprimer"}
          </Button>
        )}
        <Button
          size="sm"
          onClick={onNewDiagram}
          disabled={isCreatingDiagram}
          title="Choisir le type (Sketch, draw.io, PlantUML) puis créer le fichier"
        >
          {isCreatingDiagram ? "Création…" : "Nouveau diagramme"}
        </Button>
      </div>
    </header>
  );
}
