import { invoke } from "@tauri-apps/api/core";

export type AiStatus = {
  key_configured: boolean;
  active_model: string;
  model_source: "default" | "benchmark" | string;
  openrouter_base_url: string;
};

export async function getAiStatus(projectPath: string): Promise<AiStatus> {
  return invoke<AiStatus>("get_ai_status", { projectPath });
}
