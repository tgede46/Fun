import { invoke } from "@tauri-apps/api/core";

export type AiStatus = {
  key_configured: boolean;
  active_model: string;
  model_source: "default" | "benchmark" | string;
  openrouter_base_url: string;
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type SendChatResult = {
  assistant_message: string;
  persona: string;
  persona_display: string;
  diagram_update: string | null;
  diagram_reset: boolean;
};

export type GenerateDiagramResult = {
  path: string;
  name: string;
};

export async function getAiStatus(projectPath: string): Promise<AiStatus> {
  return invoke<AiStatus>("get_ai_status", { projectPath });
}

export async function sendChatMessage(
  projectPath: string,
  options: {
    diagramPath?: string | null;
    diagramContent?: string | null;
    history: ChatTurn[];
    userMessage: string;
  },
): Promise<SendChatResult> {
  return invoke<SendChatResult>("send_chat_message", {
    projectPath,
    diagramPath: options.diagramPath ?? null,
    diagramContent: options.diagramContent ?? null,
    history: options.history,
    userMessage: options.userMessage,
  });
}

export async function resetDiagram(
  projectPath: string,
  diagramPath: string,
): Promise<string> {
  return invoke<string>("reset_diagram", { projectPath, diagramPath });
}

export async function generateDiagramFromCode(
  projectPath: string,
): Promise<GenerateDiagramResult> {
  return invoke<GenerateDiagramResult>("generate_diagram_from_code", {
    projectPath,
  });
}

export type RunBenchmarkResult = {
  active_model: string;
  ran_at: string;
  scores: Record<string, {
    success: boolean;
    response_len: number;
    excalidraw_valid: boolean;
    composite: number;
  }>;
};

export async function runBenchmark(
  projectPath: string,
): Promise<RunBenchmarkResult> {
  return invoke<RunBenchmarkResult>("run_benchmark", { projectPath });
}
