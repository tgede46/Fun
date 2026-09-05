/**
 * Outil unifié de diagrammes — Excalidraw / draw.io / PlantUML
 *
 * Ce composant fournit une interface unifiée pour importer, éditer et exporter
 * des diagrammes dans trois formats différents, avec le FunScene comme format interne canonique.
 *
 * Architecture :
 * - Import : fichier texte ou contenu → adaptateur → FunScene
 * - Édition : le FunScene est édité via le canvas existant (CanvasRenderer ou ExcalidrawCanvas)
 * - Export : FunScene → adaptateur → fichier texte/binaire
 */

import { useCallback, useState, useRef } from "react";
import type { FunScene } from "../types";
import { excalidrawToFunScene, funSceneToExcalidrawData } from "../adapters/excalidraw";
import { drawioXmlToFunScene, funSceneToDrawioXml } from "../adapters/drawio";
import { plantumlToFunScene } from "../adapters/plantuml";

export type UnifiedDiagramFormat = "excalidraw" | "drawio" | "plantuml" | "fun";

export interface UnifiedDiagramToolProps {
  scene: FunScene;
  onSceneChange: (scene: FunScene) => void;
  /** Si fourni, permet d'exporter via glide/dialog natif */
  onExport?: (format: UnifiedDiagramFormat, content: string, filename: string) => void;
}

// ─── Helpers ───

function downloadContent(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generatePlantUMLFromScene(scene: FunScene): string {
  const lines: string[] = [];
  lines.push("@startuml");
  lines.push("");

  for (const obj of scene.objects) {
    switch (obj.type) {
      case "uml-class": {
        const e = obj as { name: string; stereotype?: string };
        const stereotype = e.stereotype ? ` <<${e.stereotype}>>` : "";
        lines.push(`class ${e.name}${stereotype} {`);
        const methods = (obj as { methods?: string[] }).methods ?? [];
        const attrs = (obj as { attributes?: string[] }).attributes ?? [];
        for (const attr of attrs) {
          lines.push(`  ${attr}`);
        }
        for (const method of methods) {
          lines.push(`  ${method}`);
        }
        lines.push("}");
        break;
      }

      case "uml-interface": {
        const e = obj as { name: string };
        lines.push(`interface ${e.name} {`);
        const methods = (obj as { methods?: string[] }).methods ?? [];
        for (const method of methods) {
          lines.push(`  ${method}`);
        }
        lines.push("}");
        break;
      }

      case "uml-component": {
        const e = obj as { name: string };
        lines.push(`component ${e.name}`);
        break;
      }

      case "uml-database": {
        const e = obj as { name: string };
        lines.push(`database ${e.name}`);
        break;
      }

      case "uml-package": {
        const e = obj as { name: string };
        lines.push(`package ${e.name} {`);
        lines.push("}");
        break;
      }

      case "uml-note": {
        const e = obj as { text: string };
        lines.push(`note "${e.text}"`);
        break;
      }

      default:
        break;
    }
  }

  // Relations (edges)
  for (const edge of scene.edges ?? []) {
    const from = edge.fromId;
    const to = edge.toId;
    const kind = edge.kind;
    let arrow = "--";

    switch (kind) {
      case "association":
        arrow = "--";
        break;
      case "inheritance":
        arrow = "|-->";
        break;
      case "implementation":
        arrow = "|*--";
        break;
      case "aggregation":
        arrow = "o--";
        break;
      case "composition":
        arrow = "*--";
        break;
      case "dependency":
        arrow = "..>";
        break;
      case "notes-link":
        arrow = "..";
        break;
      default:
        arrow = "--";
        break;
    }

    if (edge.label) {
      lines.push(`${from} ${arrow} ${to} : ${edge.label}`);
    } else {
      lines.push(`${from} ${arrow} ${to}`);
    }
  }

  lines.push("");
  lines.push("@enduml");
  return lines.join("\n");
}

export function UnifiedDiagramTool({
  scene,
  onSceneChange,
  onExport,
}: UnifiedDiagramToolProps) {
  const [activeFormat, setActiveFormat] = useState<UnifiedDiagramFormat>("fun");
  const [importMode, setImportMode] = useState<"none" | "excalidraw" | "drawio" | "plantuml">("none");
  const [importText, setImportText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─── Import texte ───

  const handleTextImport = useCallback(() => {
    if (!importText.trim()) return;

    let resultScene: FunScene | null = null;

    try {
      switch (importMode) {
        case "excalidraw": {
          try {
            const parsed = JSON.parse(importText);
            if (Array.isArray(parsed)) {
              resultScene = excalidrawToFunScene(parsed as Parameters<typeof excalidrawToFunScene>[0], {
                sourceFormat: "excalidraw",
                sourceFilename: `import-${Date.now()}.excalidraw`,
              });
            } else if (parsed.elements) {
              resultScene = excalidrawToFunScene(parsed.elements as Parameters<typeof excalidrawToFunScene>[0], {
                sourceFormat: "excalidraw",
                sourceFilename: `import-${Date.now()}.excalidraw`,
              });
            } else {
              throw new Error("Format texte Excalidraw non reconnu");
            }
          } catch {
            throw new Error("Contenu Excalidraw invalide (JSON attendu)");
          }
          break;
        }

        case "drawio": {
          resultScene = drawioXmlToFunScene(importText, {
            sourceFormat: "drawio",
            sourceFilename: `import-${Date.now()}.drawio`,
          });
          break;
        }

        case "plantuml": {
          resultScene = plantumlToFunScene(importText, {
            sourceFormat: "plantuml",
            sourceFilename: `import-${Date.now()}.puml`,
          });
          break;
        }

        default:
          throw new Error("Format d'import inconnu");
      }

      if (!resultScene) {
        throw new Error("Import vide");
      }

      onSceneChange(resultScene);
      setImportMode("none");
      setImportText("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      alert(`Import echoué : ${message}`);
    }
  }, [importMode, importText, onSceneChange]);

  // ─── Import fichier ───

  const handleFileImport = useCallback(
    (format: UnifiedDiagramFormat) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (!content) {
          alert("Fichier vide");
          return;
        }

        let resultScene: FunScene | null = null;

        try {
          switch (format) {
            case "excalidraw":
              resultScene = excalidrawToFunScene(
                JSON.parse(content) as Parameters<typeof excalidrawToFunScene>[0],
                { sourceFormat: "excalidraw", sourceFilename: file.name }
              );
              break;

            case "drawio":
              resultScene = drawioXmlToFunScene(content, {
                sourceFormat: "drawio",
                sourceFilename: file.name,
              });
              break;

            case "plantuml":
              resultScene = plantumlToFunScene(content, {
                sourceFormat: "plantuml",
                sourceFilename: file.name,
              });
              break;

            default:
              throw new Error("Format non gere");
          }

          if (!resultScene) {
            throw new Error("Import vide");
          }

          onSceneChange(resultScene);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Erreur inconnue";
          alert(`Import du fichier ${file.name} echoue : ${message}`);
        }
      };
      reader.readAsText(file);
    },
    [onSceneChange]
  );

  // ─── Export ───

  const handleExport = useCallback(
    (format: UnifiedDiagramFormat) => {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case "excalidraw": {
          const data = funSceneToExcalidrawData(scene);
          content = JSON.stringify(data, null, 2);
          filename = `diagramme-${Date.now()}.excalidraw`;
          mimeType = "application/json";
          break;
        }

        case "drawio": {
          content = funSceneToDrawioXml(scene, { minify: false });
          filename = `diagramme-${Date.now()}.drawio`;
          mimeType = "application/xml";
          break;
        }

        case "plantuml": {
          content = generatePlantUMLFromScene(scene);
          filename = `diagramme-${Date.now()}.puml`;
          mimeType = "text/plain";
          break;
        }

        case "fun": {
          content = JSON.stringify(scene, null, 2);
          filename = `diagramme-${Date.now()}.fun.json`;
          mimeType = "application/json";
          break;
        }

        default:
          return;
      }

      if (onExport) {
        onExport(format, content, filename);
      } else {
        downloadContent(content, filename, mimeType);
      }
    },
    [scene, onExport]
  );

  const acceptFileTypes = (mode: string) => {
    switch (mode) {
      case "excalidraw":
        return ".json";
      case "drawio":
        return ".drawio,.xml";
      case "plantuml":
        return ".puml,.txt";
      default:
        return ".*";
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded bg-card">
      {/* Sélecteur de format actif */}
      <div className="flex gap-1">
        <button
          className={`px-2 py-1 text-xs rounded ${activeFormat === "fun" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          onClick={() => setActiveFormat("fun")}
        >
          Fun (interne)
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${activeFormat === "excalidraw" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          onClick={() => setActiveFormat("excalidraw")}
        >
          Excalidraw
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${activeFormat === "drawio" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          onClick={() => setActiveFormat("drawio")}
        >
          draw.io
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${activeFormat === "plantuml" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          onClick={() => setActiveFormat("plantuml")}
        >
          PlantUML
        </button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Import */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Importer :</span>
        <button
          className="px-2 py-1 text-xs rounded hover:bg-muted"
          onClick={() => setImportMode("excalidraw")}
        >
          Excalidraw (texte/JSON)
        </button>
        <button
          className="px-2 py-1 text-xs rounded hover:bg-muted"
          onClick={() => setImportMode("drawio")}
        >
          draw.io (XML)
        </button>
        <button
          className="px-2 py-1 text-xs rounded hover:bg-muted"
          onClick={() => setImportMode("plantuml")}
        >
          PlantUML (texte)
        </button>
      </div>

      {/* Zone d'import texte */}
      {importMode !== "none" && (
        <div className="flex items-center gap-1 ml-1">
          <input
            type="text"
            className="px-2 py-1 text-xs rounded border w-32"
            placeholder="Contenu a importer..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <button
            className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleTextImport}
          >
            OK
          </button>
          <button
            className="px-2 py-1 text-xs rounded hover:bg-muted"
            onClick={() => setImportMode("none")}
          >
            Annuler
          </button>
          {/* Import par fichier */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={acceptFileTypes(importMode)}
            onChange={handleFileImport(importMode)}
          />
          <button
            className="px-2 py-1 text-xs rounded hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            Fichier
          </button>
        </div>
      )}

      <div className="w-px h-6 bg-border" />

      {/* Export */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Exporter :</span>
        <button
          className="px-2 py-1 text-xs rounded hover:bg-muted"
          onClick={() => handleExport("excalidraw")}
        >
          Excalidraw
        </button>
        <button
          className="px-2 py-1 text-xs rounded hover:bg-muted"
          onClick={() => handleExport("drawio")}
        >
          draw.io
        </button>
        <button
          className="px-2 py-1 text-xs rounded hover:bg-muted"
          onClick={() => handleExport("plantuml")}
        >
          PlantUML
        </button>
        <button
          className="px-2 py-1 text-xs rounded hover:bg-muted"
          onClick={() => handleExport("fun")}
        >
          Fun (JSON)
        </button>
      </div>

      {/* Info rapide */}
      <div className="text-xs text-muted-foreground ml-auto">
        {scene.objects.length} objets
        {scene.edges && scene.edges.length > 0 && ` · ${scene.edges.length} liens`}
      </div>
    </div>
  );
}
