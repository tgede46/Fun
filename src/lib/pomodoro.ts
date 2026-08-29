import { invoke } from "@tauri-apps/api/core";

export async function setPomodoroDurations(
  projectPath: string,
  workMinutes: number,
  breakMinutes: number,
): Promise<void> {
  await invoke("set_pomodoro_durations", {
    projectPath,
    workMinutes,
    breakMinutes,
  });
}

export async function notifyPomodoroPhase(
  title: string,
  body: string,
): Promise<void> {
  try {
    await invoke("notify_pomodoro_phase", { title, body });
  } catch {
    // Notifications may be unavailable in dev/browser — fail silently.
  }
}

export type PomodoroPhase = "idle" | "work" | "break";

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function phaseLabel(phase: PomodoroPhase): string {
  switch (phase) {
    case "work":
      return "Travail";
    case "break":
      return "Pause";
    default:
      return "Pomodoro";
  }
}
