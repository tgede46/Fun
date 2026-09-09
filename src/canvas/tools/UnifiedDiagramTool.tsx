/**
 * Outil unifié de diagrammes — Excalidraw / draw.io / PlantUML / Fun
 *
 * Import fichier → adaptateur → FunScene (canvas).
 * Export FunScene → fichier via dialog Tauri (le <a download> ne marche pas en WebView).
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { FunScene } from "../types";
import {
  excalidrawToFunScene,
  funSceneToExcalidrawData,
} from "../adapters/excalidraw";
import { drawioXmlToFunScene, funSceneToDrawioXml } from "../adapters/drawio";
import { plantumlToFunScene } from "../adapters/plantuml";

export type UnifiedDiagramFormat = "excalidraw" | "drawio" | "plantuml" | "fun";

export interface UnifiedDiagramToolProps {
  scene: FunScene;
  onSceneChange: (scene: FunScene) => void;
  onClose?: () => void;
}

const FORMATS: { id: UnifiedDiagramFormat; label: string }[] = [
  { id: "fun", label: "Fun (interne)" },
  { id: "excalidraw", label: "Excalidraw" },
  { id: "drawio", label: "draw.io" },
  { id: "plantuml", label: "PlantUML" },
];

function acceptFor(format: UnifiedDiagramFormat): string {
  switch (format) {
    case "excalidraw":
      return ".excalidraw,.json";
    case "drawio":
      return ".drawio,.xml";
    case "plantuml":
      return ".puml,.txt";
    case "fun":
      return ".json,.fun.json";
  }
}

function filenameFor(format: UnifiedDiagramFormat): string {
  const stamp = Date.now();
  switch (format) {
    case "excalidraw":
      return `diagramme-${stamp}.excalidraw`;
    case "drawio":
      return `diagramme-${stamp}.drawio`;
    case "plantuml":
      return `diagramme-${stamp}.puml`;
    case "fun":
      return `diagramme-${stamp}.fun.json`;
  }
}

function mimeFor(format: UnifiedDiagramFormat): string {
  switch (format) {
    case "excalidraw":
    case "fun":
      return "application/json";
    case "drawio":
      return "application/xml";
    case "plantuml":
      return "text/plain";
  }
}

function generatePlantUMLFromScene(scene: FunScene): string {
  const lines: string[] = ["@startuml", ""];

  for (const obj of scene.objects) {
    switch (obj.type) {
      case "uml-class": {
        const e = obj as { name: string; stereotype?: string };
        const stereotype = e.stereotype ? ` <<${e.stereotype}>>` : "";
        lines.push(`class ${e.name}${stereotype} {`);
        for (const attr of (obj as { attributes?: string[] }).attributes ?? []) {
          lines.push(`  ${attr}`);
        }
        for (const method of (obj as { methods?: string[] }).methods ?? []) {
          lines.push(`  ${method}`);
        }
        lines.push("}");
        break;
      }
      case "uml-interface": {
        lines.push(`interface ${(obj as { name: string }).name} {`);
        for (const method of (obj as { methods?: string[] }).methods ?? []) {
          lines.push(`  ${method}`);
        }
        lines.push("}");
        break;
      }
      case "uml-component":
        lines.push(`component ${(obj as { name: string }).name}`);
        break;
      case "uml-database":
        lines.push(`database ${(obj as { name: string }).name}`);
        break;
      case "uml-package":
        lines.push(`package ${(obj as { name: string }).name} {`);
        lines.push("}");
        break;
      case "uml-note":
        lines.push(`note "${(obj as { text: string }).text}"`);
        break;
      default:
        break;
    }
  }

  for (const edge of scene.edges ?? []) {
    let arrow = "--";
    switch (edge.kind) {
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
    }
    if (edge.label) {
      lines.push(`${edge.fromId} ${arrow} ${edge.toId} : ${edge.label}`);
    } else {
      lines.push(`${edge.fromId} ${arrow} ${edge.toId}`);
    }
  }

  lines.push("", "@enduml");
  return lines.join("\n");
}

function parseExcalidrawPayload(content: string, filename: string): FunScene {
  const parsed: unknown = JSON.parse(content);
  let elements: Parameters<typeof excalidrawToFunScene>[0];

  if (Array.isArray(parsed)) {
    elements = parsed as Parameters<typeof excalidrawToFunScene>[0];
  } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { elements?: unknown }).elements)
  ) {
    elements = (parsed as { elements: Parameters<typeof excalidrawToFunScene>[0] })
      .elements;
  } else {
    throw new Error("JSON Excalidraw invalide (elements manquant)");
  }

  return excalidrawToFunScene(elements, {
    sourceFormat: "excalidraw",
    sourceFilename: filename,
  });
}

function parseFunPayload(content: string): FunScene {
  const parsed: unknown = JSON.parse(content);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as FunScene).objects)
  ) {
    throw new Error("JSON Fun invalide (objects manquant)");
  }
  return parsed as FunScene;
}

function contentToScene(
  format: UnifiedDiagramFormat,
  content: string,
  filename: string,
): FunScene {
  switch (format) {
    case "excalidraw":
      return parseExcalidrawPayload(content, filename);
    case "drawio":
      return drawioXmlToFunScene(content, {
        sourceFormat: "drawio",
        sourceFilename: filename,
      });
    case "plantuml":
      return plantumlToFunScene(content, {
        sourceFormat: "plantuml",
        sourceFilename: filename,
      });
    case "fun":
      return parseFunPayload(content);
  }
}

function sceneToExport(
  format: UnifiedDiagramFormat,
  scene: FunScene,
): { content: string; filename: string; mimeType: string } {
  switch (format) {
    case "excalidraw":
      return {
        content: JSON.stringify(funSceneToExcalidrawData(scene), null, 2),
        filename: filenameFor(format),
        mimeType: mimeFor(format),
      };
    case "drawio":
      return {
        content: funSceneToDrawioXml(scene, { minify: false }),
        filename: filenameFor(format),
        mimeType: mimeFor(format),
      };
    case "plantuml":
      return {
        content: generatePlantUMLFromScene(scene),
        filename: filenameFor(format),
        mimeType: mimeFor(format),
      };
    case "fun":
      return {
        content: JSON.stringify(scene, null, 2),
        filename: filenameFor(format),
        mimeType: mimeFor(format),
      };
  }
}

async function saveViaTauri(content: string, defaultFilename: string): Promise<boolean> {
  return invoke<boolean>("export_text_file", {
    defaultFilename,
    content,
  });
}

function downloadFallback(content: string, filename: string, mimeType: string) {
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

export function UnifiedDiagramTool({
  scene,
  onSceneChange,
  onClose,
}: UnifiedDiagramToolProps) {
  const [activeFormat, setActiveFormat] = useState<UnifiedDiagramFormat>("excalidraw");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        onClose?.();
      }
    };
    // next tick — avoid closing on the same click that opened the panel
    const id = window.setTimeout(() => {
      window.addEventListener("pointerdown", onPointer, true);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, [onClose]);

  const applyImport = useCallback(
    (format: UnifiedDiagramFormat, content: string, filename: string) => {
      try {
        const next = contentToScene(format, content, filename);
        onSceneChange(next);
        setStatus(`Importé · ${next.objects.length} objet(s)`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setStatus(`Échec : ${message}`);
      }
    },
    [onSceneChange],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const content = typeof reader.result === "string" ? reader.result : "";
        if (!content) {
          setStatus("Fichier vide");
          return;
        }
        applyImport(activeFormat, content, file.name);
      };
      reader.onerror = () => setStatus("Lecture du fichier impossible");
      reader.readAsText(file);
    },
    [activeFormat, applyImport],
  );

  const handleExport = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const { content, filename, mimeType } = sceneToExport(activeFormat, scene);
      try {
        const saved = await saveViaTauri(content, filename);
        setStatus(saved ? `Exporté · ${filename}` : "Export annulé");
      } catch {
        downloadFallback(content, filename, mimeType);
        setStatus(`Exporté (navigateur) · ${filename}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(`Échec export : ${message}`);
    } finally {
      setBusy(false);
    }
  }, [activeFormat, scene]);

  return (
    <div
      ref={rootRef}
      className="w-80 rounded-xl border border-border bg-card shadow-lg p-3 space-y-3"
      role="dialog"
      aria-label="Import et export de diagramme"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Import / Export</p>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded"
          onClick={() => onClose?.()}
        >
          Fermer
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Ce panneau change de format de fichier — le dessin se fait sur le canvas
        avec la barre d’outils en bas.
      </p>

      <div className="flex flex-wrap gap-1">
        {FORMATS.map((fmt) => (
          <button
            key={fmt.id}
            type="button"
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              activeFormat === fmt.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => {
              setActiveFormat(fmt.id);
              setStatus(null);
            }}
          >
            {fmt.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          Importer un fichier
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={busy}
          onClick={() => void handleExport()}
        >
          Exporter
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptFor(activeFormat)}
        onChange={handleFileChange}
      />

      <p className="text-[11px] text-muted-foreground">
        {scene.objects.length} objet
        {scene.objects.length === 1 ? "" : "s"}
        {scene.edges && scene.edges.length > 0
          ? ` · ${scene.edges.length} lien${scene.edges.length === 1 ? "" : "s"}`
          : ""}
      </p>

      {status ? (
        <p className="text-xs text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
