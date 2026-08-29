import { invoke } from "@tauri-apps/api/core";

export type AiStatus = {
  key_configured: boolean;
  active_model: string;
  model_source: "default" | "benchmark" | string;
  openrouter_base_url: string;
};

export async function isOpenRouterConfigured(): Promise<boolean> {
  return invoke<boolean>("get_openrouter_key_configured");
}

export async function setOpenRouterApiKey(apiKey: string): Promise<void> {
  await invoke("set_openrouter_api_key", { apiKey });
}

export async function clearOpenRouterApiKey(): Promise<void> {
  await invoke("clear_openrouter_api_key");
}

export async function getAiStatus(projectPath: string): Promise<AiStatus> {
  return invoke<AiStatus>("get_ai_status", { projectPath });
}
