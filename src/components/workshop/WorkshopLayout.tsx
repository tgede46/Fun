"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAndLoadDiagram,
  deleteDiagram,
  listDiagrams,
  loadDiagramIntoCanvas,
  parseExcalidrawContent,
  prepareExcalidrawScene,
  saveDiagram,
  type DiagramListItem,
  type ExcalidrawInitialDataState,
} from "@/lib/diagram";
import {
  getAiStatus,
  generateDiagramFromCode,
  runBenchmark,
  sendChatMessage,
  type AiStatus,
  type BenchmarkUiState,
  type ChatTurn,
} from "@/lib/ai";
import { loadChatHistory, saveChatHistory } from "@/lib/chat-storage";
import { formatInvokeError } from "@/lib/invoke-error";
import { getProjectSettings, setProjectTheme } from "@/lib/settings";
import {
  parseFunTheme,
  toggleFunTheme,
  type FunTheme,
} from "@/lib/theme";
import { CanvasArea } from "./CanvasArea";
import { ChatSidebar } from "./ChatSidebar";
import { ConfirmDialog } from "./ConfirmDialog";
import { MeditationOverlay } from "./MeditationOverlay";
import { ModeRail } from "./ModeRail";
import { PomodoroChip } from "./PomodoroChip";
import { Toolbar } from "./Toolbar";
import { usePomodoro } from "@/hooks/usePomodoro";
import type { ExcalidrawCanvasHandle } from "./ExcalidrawCanvas";

type WorkshopMode = "sketch" | "uml";

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
  const [isDeletingDiagram, setIsDeletingDiagram] = useState(false);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [theme, setTheme] = useState<FunTheme>("light");
  const [themeError, setThemeError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>(() =>
    loadChatHistory(projectPath),
  );
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [diagramRawContent, setDiagramRawContent] = useState<string | null>(null);
  const [pomodoroWork, setPomodoroWork] = useState(25);
  const [pomodoroBreak, setPomodoroBreak] = useState(5);
  const [mode, setMode] = useState<WorkshopMode>("sketch");
  const [isGeneratingFromCode, setIsGeneratingFromCode] = useState(false);
  const [codeGenError, setCodeGenError] = useState<string | null>(null);
  const [benchmarkState, setBenchmarkState] = useState<BenchmarkUiState>("idle");
  const [benchmarkMessage, setBenchmarkMessage] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState<{
    path: string;
    label: string;
  } | null>(null);

  const canvasRef = useRef<ExcalidrawCanvasHandle>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark" || theme === "electro") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.setAttribute("data-fun-theme", theme);
  }, [theme]);

  const pomodoro = usePomodoro({
    projectPath,
    workMinutes: pomodoroWork,
    breakMinutes: pomodoroBreak,
    onDurationsChange: (work, brk) => {
      setPomodoroWork(work);
      setPomodoroBreak(brk);
    },
  });

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
          setPomodoroWork(settings.pomodoro_work_minutes);
          setPomodoroBreak(settings.pomodoro_break_minutes);
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

  useEffect(() => {
    saveChatHistory(projectPath, chatHistory);
  }, [projectPath, chatHistory]);

  useEffect(() => {
    if (!aiStatus?.key_configured) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setBenchmarkState("running");
      setBenchmarkMessage(null);
      try {
        const result = await runBenchmark(projectPath);
        if (cancelled) return;

        const refreshed = await getAiStatus(projectPath);
        if (cancelled) return;

        setAiStatus(refreshed);
        const scoreCount = Object.keys(result.scores).length;
        if (scoreCount > 0) {
          setBenchmarkState("updated");
          const short =
            result.active_model.split("/").pop()?.replace(":free", "") ??
            result.active_model;
          setBenchmarkMessage(`Benchmark terminé — modèle actif : ${short}.`);
        } else if (result.ran_at) {
          setBenchmarkState("fresh");
          setBenchmarkMessage("Benchmark à jour — aucune nouvelle évaluation nécessaire.");
        } else {
          setBenchmarkState("failed");
          setBenchmarkMessage(
            "Benchmark pas encore effectué — le modèle par défaut est utilisé.",
          );
        }
      } catch (err) {
        if (!cancelled) {
          setBenchmarkState("failed");
          setBenchmarkMessage(
            formatInvokeError(
              err,
              "Benchmark indisponible — le dernier modèle connu reste utilisé.",
            ),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectPath, aiStatus?.key_configured]);

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

  const handleSaveError = useCallback((message: string | null) => {
    setSaveError(message);
  }, []);

  const handleDiagramSaved = useCallback((content: string) => {
    setDiagramRawContent(content);
    setSaveError(null);
  }, []);

  const handleDeleteDiagram = useCallback((path?: string) => {
    const targetPath = path ?? activeDiagramPath;
    if (!targetPath) {
      return;
    }

    const label =
      path != null
        ? (path.split(/[/\\]/).pop()?.replace(/\.excalidraw$/, "") ?? "ce diagramme")
        : (diagramName ?? "ce diagramme");

    setDeletePending({ path: targetPath, label });
  }, [activeDiagramPath, diagramName]);

  const confirmDeleteDiagram = useCallback(async () => {
    if (!deletePending) {
      return;
    }

    const targetPath = deletePending.path;
    setIsDeletingDiagram(true);
    setDiagramError(null);
    setSaveError(null);

    try {
      await deleteDiagram(projectPath, targetPath);
      await refreshDiagramList();

      if (activeDiagramPath === targetPath) {
        setActiveDiagramPath(null);
        setDiagramName(null);
        setInitialData(null);
        setDiagramRawContent(null);
      }

      setDeletePending(null);
    } catch (err) {
      setDiagramError(
        formatInvokeError(err, "Impossible de supprimer ce diagramme."),
      );
    } finally {
      setIsDeletingDiagram(false);
    }
  }, [
    activeDiagramPath,
    deletePending,
    projectPath,
    refreshDiagramList,
  ]);

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
          history: chatHistory.filter((t) => t.role !== "system"),
          userMessage: message,
        });

        const assistantTurn: ChatTurn = {
          role: "assistant",
          content: result.assistant_message,
          personaDisplay: result.persona_display,
        };
        const nextHistory: ChatTurn[] = [...historyWithUser, assistantTurn];

        const targetPath = result.opened_diagram_path ?? activeDiagramPath;

        if (result.opened_diagram_path) {
          await refreshDiagramList();
          setActiveDiagramPath(result.opened_diagram_path);
          setDiagramName(result.opened_diagram_name);
        }

        if (result.diagram_update && targetPath) {
          const { initialData: sanitized, sanitizedJson } =
            await prepareExcalidrawScene(result.diagram_update);

          setInitialData(sanitized);
          setDiagramRawContent(sanitizedJson);

          if (targetPath) {
            try {
              await saveDiagram(projectPath, targetPath, sanitizedJson);
            } catch (err) {
              setSaveError(
                formatInvokeError(err, "Diagramme affiché mais sauvegarde échouée."),
              );
            }
          }

          nextHistory.push({
            role: "system",
            content: result.opened_diagram_path
              ? "✓ Nouveau diagramme créé et affiché sur le canvas (Trace)."
              : "✓ Diagramme mis à jour sur le canvas (Trace).",
          });
        } else if (
          result.persona === "editeur-canvas" &&
          !result.diagram_update &&
          !result.diagram_reset
        ) {
          nextHistory.push({
            role: "system",
            content:
              "Trace n'a pas produit de JSON Excalidraw — rien n'a été dessiné. Essayez : « Crée un diagramme de démo avec Début, Action, Fin ».",
          });
        }

        if (result.diagram_reset && targetPath) {
          try {
            const reloaded = await loadDiagramIntoCanvas(
              projectPath,
              targetPath,
            );
            setInitialData(reloaded.initialData);
            setDiagramRawContent(reloaded.rawContent);
            nextHistory.push({
              role: "system",
              content: "✓ Canvas réinitialisé — diagramme vide rechargé.",
            });
          } catch {
            setChatError("Le diagramme a été réinitialisé mais le rechargement a échoué.");
          }
        }

        setChatHistory(nextHistory);
      } catch (err) {
        setChatError(
          formatInvokeError(
            err,
            "Impossible de joindre l'assistant. Vérifiez votre connexion et la clé OpenRouter.",
          ),
        );
        // Retirer le message utilisateur optimiste si l'envoi a échoué
        setChatHistory(chatHistory);
      } finally {
        setChatLoading(false);
      }
    },
    [projectPath, activeDiagramPath, diagramRawContent, chatHistory, refreshDiagramList],
  );

  const handleGenerateFromCode = useCallback(async () => {
    setIsGeneratingFromCode(true);
    setCodeGenError(null);

    try {
      const result = await generateDiagramFromCode(projectPath);
      await refreshDiagramList();
      await openDiagram(result.path);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "system",
          content: `✓ Diagramme « ${result.name} » généré depuis le code du projet.`,
        },
      ]);
    } catch (err) {
      setCodeGenError(
        err instanceof Error
          ? err.message
          : "Impossible de générer le diagramme depuis le code.",
      );
    } finally {
      setIsGeneratingFromCode(false);
    }
  }, [projectPath, refreshDiagramList, openDiagram]);

  return (
    <div className="workshop-shell flex flex-col h-screen bg-background" data-fun-theme={theme}>
      <Toolbar
        projectName={projectName}
        theme={theme}
        themeError={themeError}
        mode={mode}
        onToggleTheme={() => {
          void handleToggleTheme();
        }}
        onNewDiagram={() => {
          void handleNewDiagram();
        }}
        onGenerateFromCode={() => {
          void handleGenerateFromCode();
        }}
        isCreatingDiagram={isCreatingDiagram}
        isGeneratingFromCode={isGeneratingFromCode}
        canDeleteDiagram={!!activeDiagramPath}
        isDeletingDiagram={isDeletingDiagram}
        onDeleteDiagram={() => {
          void handleDeleteDiagram();
        }}
      />
      <div className="flex flex-1 min-h-0">
        <ModeRail activeMode={mode} onModeChange={setMode} />
        <CanvasArea
          projectPath={projectPath}
          theme={theme}
          mode={mode}
          diagrams={diagrams}
          activeDiagramPath={activeDiagramPath}
          diagramName={diagramName}
          initialData={initialData}
          error={diagramError}
          saveError={saveError}
          codeGenError={codeGenError}
          onSelectDiagram={handleSelectDiagram}
          onDeleteDiagram={(diagramPath) => {
            void handleDeleteDiagram(diagramPath);
          }}
          onSaveError={handleSaveError}
          onDiagramSaved={handleDiagramSaved}
          canvasRef={canvasRef}
        />
        <ChatSidebar
          aiStatus={aiStatus}
          aiError={aiError}
          benchmarkState={benchmarkState}
          benchmarkMessage={benchmarkMessage}
          history={chatHistory}
          loading={chatLoading}
          chatError={chatError}
          onSend={handleSendChat}
        />
      </div>
      <PomodoroChip
        timerLabel={pomodoro.timerLabel}
        timerDisplay={pomodoro.timerDisplay}
        isRunning={pomodoro.isRunning}
        configOpen={pomodoro.configOpen}
        workMinutes={pomodoro.workMinutes}
        breakMinutes={pomodoro.breakMinutes}
        saveError={pomodoro.saveError}
        onToggleConfig={() => pomodoro.setConfigOpen(!pomodoro.configOpen)}
        onWorkChange={pomodoro.setWorkMinutes}
        onBreakChange={pomodoro.setBreakMinutes}
        onSaveConfig={() => void pomodoro.saveConfig()}
        onStart={pomodoro.handleStart}
        onStop={pomodoro.handleStop}
      />
      <MeditationOverlay
        open={pomodoro.showMeditation}
        onDismiss={pomodoro.dismissMeditation}
      />
      <ConfirmDialog
        open={deletePending != null}
        title={`Supprimer « ${deletePending?.label ?? ""} » ?`}
        message="Le fichier .excalidraw sera définitivement effacé du disque. Cette action est irréversible."
        confirmLabel="Supprimer"
        loading={isDeletingDiagram}
        onConfirm={() => {
          void confirmDeleteDiagram();
        }}
        onCancel={() => {
          if (!isDeletingDiagram) {
            setDeletePending(null);
          }
        }}
      />
    </div>
  );
}
