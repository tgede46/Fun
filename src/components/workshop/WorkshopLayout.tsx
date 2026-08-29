"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAndLoadDiagram,
  listDiagrams,
  loadDiagramIntoCanvas,
  type DiagramListItem,
  type ExcalidrawInitialDataState,
} from "@/lib/diagram";
import { CanvasArea } from "./CanvasArea";
import { ChatSidebar } from "./ChatSidebar";
import { ModeRail } from "./ModeRail";
import { Toolbar } from "./Toolbar";

type WorkshopLayoutProps = {
  projectName: string;
  projectPath: string;
};

export function WorkshopLayout({ projectName, projectPath }: WorkshopLayoutProps) {
  const [diagrams, setDiagrams] = useState<DiagramListItem[]>([]);
  const [activeDiagramPath, setActiveDiagramPath] = useState<string | null>(null);
  const [diagramName, setDiagramName] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null>(
    null,
  );
  const [isCreatingDiagram, setIsCreatingDiagram] = useState(false);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refreshDiagramList = useCallback(async () => {
    try {
      const items = await listDiagrams(projectPath);
      setDiagrams(items);
    } catch {
      setDiagramError("Impossible de charger la liste des diagrammes.");
    }
  }, [projectPath]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const items = await listDiagrams(projectPath);
        if (!cancelled) {
          setDiagrams(items);
        }
      } catch {
        if (!cancelled) {
          setDiagramError("Impossible de charger la liste des diagrammes.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  const openDiagram = useCallback(
    async (path: string) => {
      setDiagramError(null);
      setSaveError(null);

      try {
        const result = await loadDiagramIntoCanvas(projectPath, path);
        setActiveDiagramPath(result.path);
        setDiagramName(result.name);
        setInitialData(result.initialData);
      } catch (err) {
        setDiagramError(
          err instanceof Error ? err.message : "Impossible d'ouvrir ce diagramme.",
        );
      }
    },
    [projectPath],
  );

  const handleNewDiagram = useCallback(async () => {
    setIsCreatingDiagram(true);
    setDiagramError(null);
    setSaveError(null);

    try {
      const result = await createAndLoadDiagram(projectPath);
      setActiveDiagramPath(result.path);
      setDiagramName(result.name);
      setInitialData(result.initialData);
      await refreshDiagramList();
    } catch (err) {
      setDiagramError(
        err instanceof Error ? err.message : "Impossible de créer le diagramme.",
      );
    } finally {
      setIsCreatingDiagram(false);
    }
  }, [projectPath, refreshDiagramList]);

  const handleSelectDiagram = useCallback(
    (path: string) => {
      if (path === activeDiagramPath) {
        return;
      }
      void openDiagram(path);
    },
    [activeDiagramPath, openDiagram],
  );

  const handleSaveError = useCallback((message: string) => {
    setSaveError(message);
  }, []);

  return (
    <div className="workshop-shell">
      <Toolbar
        projectName={projectName}
        onNewDiagram={() => {
          void handleNewDiagram();
        }}
        isCreatingDiagram={isCreatingDiagram}
      />
      <div className="workshop-shell__body">
        <ModeRail />
        <CanvasArea
          projectPath={projectPath}
          diagrams={diagrams}
          activeDiagramPath={activeDiagramPath}
          diagramName={diagramName}
          initialData={initialData}
          error={diagramError}
          saveError={saveError}
          onSelectDiagram={handleSelectDiagram}
          onSaveError={handleSaveError}
        />
        <ChatSidebar />
      </div>
    </div>
  );
}
