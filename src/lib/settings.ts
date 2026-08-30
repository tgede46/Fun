import { invoke } from "@tauri-apps/api/core";
import type { FunTheme } from "@/lib/theme";

export type ProjectSettings = {
  pomodoro_work_minutes: number;
  pomodoro_break_minutes: number;
  theme: string;
  electro_theme: boolean;
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
