"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createDiagramOfKind,
  createDiagramWithContent,
  createDrawioDiagram,
  deleteDiagram,
  deserializeFunScene,
  listDiagrams,
  loadDiagram,
  saveDiagram,
  saveDrawioDiagram,
  serializeFunScene,
  type DiagramKind,
  type DiagramListItem,
} from "@/lib/diagram";
import { convertDiagramContent, kindFromPath, sceneFromContent } from "@/lib/diagram-convert";
import { fileToResizedJpeg } from "@/lib/image-resize";
import {
  getAiStatus,
  generateDiagramFromCode,
  generateDiagramFromImage,
  runBenchmark,
  sendChatMessage,
  type AiStatus,
  type BenchmarkUiState,
  type ChatTurn,
} from "@/lib/ai";
import { loadChatHistory, saveChatHistory } from "@/lib/chat-storage";
import { chatCompleteBody, notifyChatComplete } from "@/lib/chat-notify";
import { formatInvokeError } from "@/lib/invoke-error";
import { getProjectSettings, setProjectTheme } from "@/lib/settings";
import {
  parseFunTheme,
  toggleFunTheme,
  type FunTheme,
} from "@/lib/theme";
import { CanvasArea } from "./CanvasArea";
import { ConfirmDialog } from "./ConfirmDialog";
import { FloatingCompanionsHost } from "./FloatingCompanionsHost";
import { MeditationOverlay } from "./MeditationOverlay";
import { ModeRail, type WorkshopMode } from "./ModeRail";
import { NewDiagramDialog } from "./NewDiagramDialog";
import { Toolbar } from "./Toolbar";
import { usePomodoro } from "@/hooks/usePomodoro";
import type { FunScene } from "@/canvas/types";
type WorkshopLayoutProps = {
  projectName: string;
  projectPath: string;
};

export function WorkshopLayout({ projectName, projectPath }: WorkshopLayoutProps) {
  const [diagrams, setDiagrams] = useState<DiagramListItem[]>([]);
  const [activeDiagramPath, setActiveDiagramPath] = useState<string | null>(null);
  const [diagramName, setDiagramName] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [scene, setScene] = useState<FunScene | null>(null);
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

  // États spécifiques au mode UML (drawio)
  const [drawioXml, setDrawioXml] = useState<string | null>(null);
  const [plantumlSource, setPlantumlSource] = useState<string | null>(null);
  const [newDiagramOpen, setNewDiagramOpen] = useState(false);
  const [convertMessage, setConvertMessage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Sélection multiple de diagrammes
  const [selectedDiagramPaths, setSelectedDiagramPaths] = useState<Set<string>>(new Set());

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

  const [pomodoroCompact, setPomodoroCompact] = useState(false);

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
    if (!aiStatus?.key_configured) return;

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
          setBenchmarkMessage("Benchmark à jour.");
        } else {
          setBenchmarkState("failed");
          setBenchmarkMessage("Benchmark pas encore effectué.");
        }
      } catch (err) {
        if (!cancelled) {
          setBenchmarkState("failed");
          setBenchmarkMessage(
            formatInvokeError(err, "Benchmark indisponible."),
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
        const kind = kindFromPath(path);
        const loaded = await loadDiagram(projectPath, path);

        if (kind === "drawio") {
          setDrawioXml(loaded.content);
          setScene(null);
          setPlantumlSource(null);
          setMode("uml");
        } else if (kind === "plantuml") {
          setPlantumlSource(loaded.content);
          setScene(sceneFromContent("plantuml", loaded.content));
          setDrawioXml(null);
          setMode("plantuml");
        } else {
          setScene(await deserializeFunScene(loaded.content));
          setDrawioXml(null);
          setPlantumlSource(null);
          setMode("sketch");
        }

        const name =
          path.split(/[/\\]/).pop()?.replace(/\.(excalidraw|drawio|puml)$/, "") ?? "diagramme";
        setActiveDiagramPath(loaded.path);
        setDiagramName(name);
      } catch (err) {
        setDiagramError(
          err instanceof Error ? err.message : "Impossible d'ouvrir ce diagramme.",
        );
      }
    },
    [projectPath],
  );

  const handleCreateOfKind = useCallback(
    async (kind: DiagramKind) => {
      setIsCreatingDiagram(true);
      setDiagramError(null);
      setSaveError(null);
      setNewDiagramOpen(false);

      try {
        const result = await createDiagramOfKind(projectPath, kind);
        await refreshDiagramList();
        await openDiagram(result.path);
      } catch (err) {
        setDiagramError(
          err instanceof Error ? err.message : "Impossible de créer le diagramme.",
        );
      } finally {
        setIsCreatingDiagram(false);
      }
    },
    [openDiagram, projectPath, refreshDiagramList],
  );

  const handleNewDiagram = useCallback(() => {
    setNewDiagramOpen(true);
  }, []);

  const handleSelectDiagram = useCallback(
    (path: string) => {
      if (path === activeDiagramPath) return;
      void openDiagram(path);
    },
    [activeDiagramPath, openDiagram],
  );

  const handleDeleteDiagram = useCallback((path?: string) => {
    const targetPath = path ?? activeDiagramPath;
    if (!targetPath) return;

    const label =
      path != null
        ? (path.split(/[/\\]/).pop()?.replace(/\.(excalidraw|drawio)$/, "") ?? "ce diagramme")
        : (diagramName ?? "ce diagramme");

    setDeletePending({ path: targetPath, label });
  }, [activeDiagramPath, diagramName]);

  const confirmDeleteDiagram = useCallback(async () => {
    if (!deletePending) return;

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
        setScene(null);
        setDrawioXml(null);
        setPlantumlSource(null);
      }

      setDeletePending(null);
    } catch (err) {
      setDiagramError(
        formatInvokeError(err, "Impossible de supprimer ce diagramme."),
      );
    } finally {
      setIsDeletingDiagram(false);
    }
  }, [activeDiagramPath, deletePending, projectPath, refreshDiagramList]);

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

  const handleSceneChange = useCallback(
    (newScene: FunScene) => {
      setScene(newScene);
      if (activeDiagramPath && kindFromPath(activeDiagramPath) === "sketch") {
        void saveDiagram(projectPath, activeDiagramPath, serializeFunScene(newScene)).catch((err) => {
          setSaveError(formatInvokeError(err, "Sauvegarde échouée."));
        });
      }
    },
    [projectPath, activeDiagramPath],
  );

  const handlePlantumlSourceChange = useCallback(
    (source: string) => {
      setPlantumlSource(source);
      if (activeDiagramPath && kindFromPath(activeDiagramPath) === "plantuml") {
        void saveDiagram(projectPath, activeDiagramPath, source).catch((err) => {
          setSaveError(formatInvokeError(err, "Sauvegarde échouée."));
        });
      }
    },
    [activeDiagramPath, projectPath],
  );

  const handleConvertDiagram = useCallback(
    async (path: string, targetKind: DiagramKind) => {
      setConvertMessage(null);
      try {
        const loaded = await loadDiagram(projectPath, path);
        const sourceKind = kindFromPath(path);
        const converted = convertDiagramContent(sourceKind, targetKind, loaded.content);
        const created = await createDiagramWithContent(
          projectPath,
          targetKind,
          converted.content,
        );
        await refreshDiagramList();
        await openDiagram(created.path);
        const lost = Math.round(converted.lostRatio * 100);
        setConvertMessage(
          lost > 50
            ? `Converti · ${converted.scene.objects.length} objet(s) — perte ${lost} %. Complète avec l’IA si besoin.`
            : `Converti · ${converted.scene.objects.length} objet(s)`,
        );
      } catch (err) {
        setDiagramError(
          err instanceof Error ? err.message : "Conversion impossible.",
        );
      }
    },
    [openDiagram, projectPath, refreshDiagramList],
  );

  // Sauvegarde automatique du XML drawio
  const handleDrawioXmlChange = useCallback(
    async (xml: string) => {
      setDrawioXml(xml);
      if (activeDiagramPath) {
        try {
          await saveDrawioDiagram(projectPath, activeDiagramPath, xml);
        } catch (err) {
          setSaveError(formatInvokeError(err, "Sauvegarde échouée."));
        }
      }
    },
    [projectPath, activeDiagramPath],
  );

  const handleCreateDrawioDiagram = useCallback(async () => {
    setIsCreatingDiagram(true);
    setDiagramError(null);
    setSaveError(null);

    try {
      const result = await createDrawioDiagram(projectPath);
      await refreshDiagramList();
      await openDiagram(result.path);
    } catch (err) {
      setDiagramError(
        err instanceof Error ? err.message : "Impossible de créer le diagramme UML.",
      );
    } finally {
      setIsCreatingDiagram(false);
    }
  }, [openDiagram, projectPath, refreshDiagramList]);



  const handleSendChat = useCallback(
    async (message: string) => {
      setChatError(null);
      setChatLoading(true);

      const userTurn: ChatTurn = { role: "user", content: message };
      const historyWithUser = [...chatHistory, userTurn];
      setChatHistory(historyWithUser);

      // Charger le contenu des diagrammes sélectionnés
      const selectedContents: string[] = [];
      for (const selPath of selectedDiagramPaths) {
        try {
          const loaded = await loadDiagram(projectPath, selPath);
          selectedContents.push(loaded.content);
        } catch {
          // Ignorer les diagrammes illisibles
        }
      }

      try {
        const result = await sendChatMessage(projectPath, {
          diagramPath: activeDiagramPath,
          diagramContent:
            plantumlSource ??
            drawioXml ??
            (scene ? JSON.stringify(scene) : null),
          selectedDiagramPaths: selectedContents.length > 0 ? selectedContents : undefined,
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
          await openDiagram(result.opened_diagram_path);
        }

        if (result.diagram_update && targetPath) {
          try {
            await saveDiagram(projectPath, targetPath, result.diagram_update);
            const kind = kindFromPath(targetPath);
            if (kind === "plantuml") {
              setPlantumlSource(result.diagram_update);
              setScene(sceneFromContent("plantuml", result.diagram_update));
              setDrawioXml(null);
            } else if (kind === "drawio") {
              setDrawioXml(result.diagram_update);
              setScene(null);
            } else {
              setScene(await deserializeFunScene(result.diagram_update));
              setDrawioXml(null);
              setPlantumlSource(null);
            }
          } catch (err) {
            setSaveError(
              formatInvokeError(err, "Diagramme affiché mais sauvegarde échouée."),
            );
          }

          nextHistory.push({
            role: "system",
            content: result.opened_diagram_path
              ? "Nouveau diagramme créé et affiché sur le canvas."
              : "Diagramme mis à jour sur le canvas.",
          });
        } else if (
          result.persona === "editeur-canvas" &&
          !result.diagram_update &&
          !result.diagram_reset
        ) {
          nextHistory.push({
            role: "system",
            content: "Trace n'a pas produit de JSON — rien n'a été dessiné.",
          });
        }

        if (result.diagram_reset && targetPath) {
          await openDiagram(targetPath);
          nextHistory.push({
            role: "system",
            content: "Canvas réinitialisé.",
          });
        }

        setChatHistory(nextHistory);

        void notifyChatComplete(
          "Fun — Chat",
          chatCompleteBody({
            personaDisplay: result.persona_display,
            diagramUpdated: !!result.diagram_update,
            diagramCreated: !!result.opened_diagram_path,
          }),
        );
      } catch (err) {
        setChatError(
          formatInvokeError(
            err,
            "Impossible de joindre l'assistant.",
          ),
        );
        setChatHistory(chatHistory);
        void notifyChatComplete(
          "Fun — Chat",
          chatCompleteBody({
            diagramUpdated: false,
            diagramCreated: false,
            error: "failed",
          }),
        );
      } finally {
        setChatLoading(false);
      }
    },
    [projectPath, activeDiagramPath, scene, drawioXml, plantumlSource, chatHistory, refreshDiagramList, selectedDiagramPaths, openDiagram],
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
          content: `Diagramme « ${result.name} » généré depuis le code du projet.`,
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

  const handleImageFile = useCallback(
    async (file: File) => {
      setIsGeneratingFromCode(true);
      setCodeGenError(null);
      try {
        const resized = await fileToResizedJpeg(file);
        const result = await generateDiagramFromImage(
          projectPath,
          resized.base64,
          resized.mime,
        );
        URL.revokeObjectURL(resized.previewUrl);
        await refreshDiagramList();
        await openDiagram(result.path);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "system",
            content: `Diagramme « ${result.name} » généré depuis l'image.`,
          },
        ]);
      } catch (err) {
        setCodeGenError(
          formatInvokeError(err, "Impossible de générer le diagramme depuis l'image."),
        );
      } finally {
        setIsGeneratingFromCode(false);
      }
    },
    [openDiagram, projectPath, refreshDiagramList],
  );

  const handleToggleSelectDiagram = useCallback((path: string) => {
    setSelectedDiagramPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Déterminer si on peut supprimer le diagramme actif
  const canDeleteDiagram = !!activeDiagramPath;

  return (
    <div className="workshop-shell flex flex-col h-screen bg-background" data-fun-theme={theme}>
      <Toolbar
        projectName={projectName}
        projectPath={projectPath}
        theme={theme}
        themeError={themeError}
        mode={mode}
        focusMode={focusMode}
        onToggleFocusMode={() => {
          setFocusMode((prev) => {
            if (!prev) {
              setLayersOpen(false);
            }
            return !prev;
          });
        }}
        onToggleTheme={() => {
          void handleToggleTheme();
        }}
        onNewDiagram={() => {
          void handleNewDiagram();
        }}
        onGenerateFromCode={() => {
          void handleGenerateFromCode();
        }}
        onGenerateFromImage={() => {
          imageInputRef.current?.click();
        }}
        isCreatingDiagram={isCreatingDiagram}
        isGeneratingFromCode={isGeneratingFromCode}
        canDeleteDiagram={canDeleteDiagram}
        isDeletingDiagram={isDeletingDiagram}
        onDeleteDiagram={() => {
          void handleDeleteDiagram();
        }}
      />
      <div className="flex flex-1 min-h-0">
        <ModeRail
          activeMode={mode}
          onModeChange={(next) => {
            if (!activeDiagramPath) {
              setMode(next);
            }
          }}
        />
        <CanvasArea
          projectPath={projectPath}
          theme={theme}
          mode={mode}
          focusMode={focusMode}
          layersOpen={layersOpen}
          onLayersOpenChange={setLayersOpen}
          diagrams={diagrams}
          activeDiagramPath={activeDiagramPath}
          selectedDiagramPaths={selectedDiagramPaths}
          diagramName={diagramName}
          scene={scene}
          plantumlSource={plantumlSource}
          error={diagramError}
          saveError={saveError}
          codeGenError={codeGenError}
          convertMessage={convertMessage}
          drawioXml={drawioXml}
          onSelectDiagram={handleSelectDiagram}
          onToggleSelectDiagram={handleToggleSelectDiagram}
          onDeleteDiagram={(diagramPath) => {
            void handleDeleteDiagram(diagramPath);
          }}
          onConvertDiagram={(path, kind) => {
            void handleConvertDiagram(path, kind);
          }}
          onSaveError={setSaveError}
          onSceneChange={handleSceneChange}
          onCreateDrawioDiagram={handleCreateDrawioDiagram}
          onDrawioXmlChange={handleDrawioXmlChange}
          onPlantumlSourceChange={handlePlantumlSourceChange}
          onPlantumlGenerate={(next) => {
            setScene({ ...next, id: crypto.randomUUID() });
          }}
        />
      </div>
      <FloatingCompanionsHost
        projectPath={projectPath}
        focusMode={focusMode}
        layersOpen={layersOpen}
        chat={{
          aiStatus,
          aiError,
          benchmarkState,
          benchmarkMessage,
          history: chatHistory,
          loading: chatLoading || isGeneratingFromCode,
          chatError,
          onSend: handleSendChat,
          onImageFile: (file) => {
            void handleImageFile(file);
          },
        }}
        pomodoro={{
          timerLabel: pomodoro.timerLabel,
          timerDisplay: pomodoro.timerDisplay,
          isRunning: pomodoro.isRunning,
          phase: pomodoro.phase,
          workGeneration: pomodoro.workGeneration,
          configOpen: pomodoro.configOpen,
          workMinutes: pomodoro.workMinutes,
          breakMinutes: pomodoro.breakMinutes,
          secondsRemaining: pomodoro.secondsRemaining,
          saveError: pomodoro.saveError,
          setConfigOpen: pomodoro.setConfigOpen,
          setWorkMinutes: pomodoro.setWorkMinutes,
          setBreakMinutes: pomodoro.setBreakMinutes,
          saveConfig: pomodoro.saveConfig,
          handleStart: pomodoro.handleStart,
          handleStop: pomodoro.handleStop,
          compactMode: pomodoroCompact,
          setCompactMode: setPomodoroCompact,
        }}
      />
      <MeditationOverlay
        open={pomodoro.showMeditation}
        onDismiss={pomodoro.dismissMeditation}
      />
      <NewDiagramDialog
        open={newDiagramOpen}
        onClose={() => setNewDiagramOpen(false)}
        onChoose={(kind) => {
          void handleCreateOfKind(kind);
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleImageFile(file);
        }}
      />
      <ConfirmDialog
        open={deletePending != null}
        title={`Supprimer « ${deletePending?.label ?? ""} » ?`}
        message="Le fichier sera définitivement effacé du disque. Cette action est irréversible."
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
