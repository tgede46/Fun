"use client";

import { useCallback, useState } from "react";
import {
  createAndLoadDiagram,
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
  const [diagramName, setDiagramName] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null>(
    null,
  );
  const [isCreatingDiagram, setIsCreatingDiagram] = useState(false);
  const [diagramError, setDiagramError] = useState<string | null>(null);

  const handleNewDiagram = useCallback(async () => {
    setIsCreatingDiagram(true);
    setDiagramError(null);

    try {
      const result = await createAndLoadDiagram(projectPath);
      setDiagramName(result.name);
      setInitialData(result.initialData);
    } catch (err) {
      setDiagramError(
        err instanceof Error ? err.message : "Impossible de créer le diagramme.",
      );
    } finally {
      setIsCreatingDiagram(false);
    }
  }, [projectPath]);

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
          diagramName={diagramName}
          initialData={initialData}
          error={diagramError}
        />
        <ChatSidebar />
      </div>
    </div>
  );
}
