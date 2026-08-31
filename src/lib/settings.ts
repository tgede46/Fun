import { invoke } from "@tauri-apps/api/core";
import type { FunTheme } from "@/lib/theme";

export type CompanionPosition = {
  x: number;
  y: number;
};

export type ProjectSettings = {
  pomodoro_work_minutes: number;
  pomodoro_break_minutes: number;
  theme: string;
  companion_chat: CompanionPosition | null;
  companion_pomo: CompanionPosition | null;
};

export async function getProjectSettings(
  projectPath: string,
): Promise<ProjectSettings> {
  return invoke<ProjectSettings>("get_project_settings", { projectPath });
}

export async function setProjectTheme(
  projectPath: string,
  theme: FunTheme,
): Promise<ProjectSettings> {
  return invoke<ProjectSettings>("set_project_theme", {
    projectPath,
    theme,
  });
}

export async function setCompanionPosition(
  projectPath: string,
  companion: "chat" | "pomo",
  x: number,
  y: number,
): Promise<ProjectSettings> {
  return invoke<ProjectSettings>("set_companion_position", {
    projectPath,
    companion,
    x,
    y,
  });
}
