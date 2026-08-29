"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAndLoadDiagram,
  listDiagrams,
  loadDiagramIntoCanvas,
  type DiagramListItem,
  type ExcalidrawInitialDataState,
} from "@/lib/diagram";
import {
  getAiStatus,
  sendChatMessage,
  type AiStatus,
  type ChatTurn,
} from "@/lib/ai";
import { getProjectSettings, setProjectTheme } from "@/lib/settings";
import {
  parseFunTheme,
  toggleFunTheme,
  type FunTheme,
} from "@/lib/theme";
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
  const [theme, setTheme] = useState<FunTheme>("light");
  const [themeError, setThemeError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [diagramRawContent, setDiagramRawContent] = useState<string | null>(null);

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
        const [items, settings, ai] = await Promise.all([
          listDiagrams(projectPath),
          getProjectSettings(projectPath),
          getAiStatus(projectPath),
        ]);
        if (!cancelled) {
          setDiagrams(items);
          setTheme(parseFunTheme(settings.theme));
          setAiStatus(ai);
          setAiError(null);
        }
      } catch {
        if (!cancelled) {
          setDiagramError("Impossible de charger la liste des diagrammes.");
          setAiError("Impossible de charger le statut IA.");
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
        setDiagramRawContent(result.rawContent);
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
      setDiagramRawContent(result.rawContent);
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

  const handleToggleTheme = useCallback(async () => {
    const next = toggleFunTheme(theme);
    setThemeError(null);

    try {
      const updated = await setProjectTheme(projectPath, next);
      setTheme(parseFunTheme(updated.theme));
    } catch {
      setThemeError("Impossible de sauvegarder le thème.");
    }
  }, [projectPath, theme]);

  const handleSendChat = useCallback(
    async (message: string) => {
      setChatError(null);
      setChatLoading(true);

      const userTurn: ChatTurn = { role: "user", content: message };
      const historyWithUser = [...chatHistory, userTurn];
      setChatHistory(historyWithUser);

      try {
        const result = await sendChatMessage(projectPath, {
          diagramPath: activeDiagramPath,
          diagramContent: diagramRawContent,
          history: chatHistory,
          userMessage: message,
        });

        const assistantTurn: ChatTurn = {
          role: "assistant",
          content: result.assistant_message,
        };
        setChatHistory([...historyWithUser, assistantTurn]);

        if (result.diagram_reset && activeDiagramPath) {
          try {
            const reloaded = await loadDiagramIntoCanvas(
              projectPath,
              activeDiagramPath,
            );
            setInitialData(reloaded.initialData);
            setDiagramRawContent(reloaded.rawContent);
          } catch {
            setChatError("Le diagramme a été réinitialisé mais le rechargement a échoué.");
          }
        }
      } catch (err) {
        setChatError(
          err instanceof Error
            ? err.message
            : "Impossible de joindre l'assistant. Vérifiez votre connexion.",
        );
      } finally {
        setChatLoading(false);
      }
    },
    [projectPath, activeDiagramPath, diagramRawContent, chatHistory],
  );

  return (
    <div className="workshop-shell" data-fun-theme={theme}>
      <Toolbar
        projectName={projectName}
        theme={theme}
        themeError={themeError}
        onToggleTheme={() => {
          void handleToggleTheme();
        }}
        onNewDiagram={() => {
          void handleNewDiagram();
        }}
        isCreatingDiagram={isCreatingDiagram}
      />
      <div className="workshop-shell__body">
        <ModeRail />
        <CanvasArea
          projectPath={projectPath}
          theme={theme}
          diagrams={diagrams}
          activeDiagramPath={activeDiagramPath}
          diagramName={diagramName}
          initialData={initialData}
          error={diagramError}
          saveError={saveError}
          onSelectDiagram={handleSelectDiagram}
          onSaveError={handleSaveError}
        />
        <ChatSidebar
          aiStatus={aiStatus}
          aiError={aiError}
          history={chatHistory}
          loading={chatLoading}
          chatError={chatError}
          onSend={handleSendChat}
        />
      </div>
    </div>
  );
}
