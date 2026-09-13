import { invoke } from "@tauri-apps/api/core";
import type { FunTheme } from "@/lib/theme";

export type CompanionPosition = {
  x: number;
  y: number;
};

/** Style du compteur flottant pendant un Pomodoro. */
export type TimerDisplayStyle = "ring_time" | "ring_tomato" | "pill";

export const TIMER_DISPLAY_OPTIONS: {
  id: TimerDisplayStyle;
  label: string;
  hint: string;
}[] = [
  {
    id: "ring_time",
    label: "Temps",
    hint: "Anneau + chrono au centre",
  },
  {
    id: "ring_tomato",
    label: "Tomate",
    hint: "Anneau + 🍅 + badge temps",
  },
  {
    id: "pill",
    label: "Pilule",
    hint: "🍅 24:18 en barre",
  },
];

export function parseTimerDisplay(value: string | undefined | null): TimerDisplayStyle {
  if (value === "ring_tomato" || value === "pill" || value === "ring_time") {
    return value;
  }
  return "ring_time";
}

export type ProjectSettings = {
  pomodoro_work_minutes: number;
  pomodoro_break_minutes: number;
  theme: string;
  companion_chat: CompanionPosition | null;
  companion_pomo: CompanionPosition | null;
  lofi_muted: boolean;
  lofi_volume: number;
  timer_display: string;
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

export async function setLofiPrefs(
  projectPath: string,
  muted: boolean,
  volume: number,
): Promise<ProjectSettings> {
  return invoke<ProjectSettings>("set_lofi_prefs", {
    projectPath,
    muted,
    volume,
  });
}

export async function setTimerDisplay(
  projectPath: string,
  timerDisplay: TimerDisplayStyle,
): Promise<ProjectSettings> {
  return invoke<ProjectSettings>("set_timer_display", {
    projectPath,
    timerDisplay,
  });
}
