import type { ChatTurn } from "@/lib/ai";

function storageKey(projectPath: string) {
  return `fun-chat:${projectPath}`;
}

export function loadChatHistory(projectPath: string): ChatTurn[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = sessionStorage.getItem(storageKey(projectPath));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ChatTurn[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(projectPath: string, history: ChatTurn[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(storageKey(projectPath), JSON.stringify(history));
  } catch {
    // sessionStorage plein ou indisponible — ignorer
  }
}
