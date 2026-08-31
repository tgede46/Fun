import { invoke } from "@tauri-apps/api/core";

export async function notifyChatComplete(
  title: string,
  body: string,
): Promise<void> {
  try {
    await invoke("notify_chat_complete", { title, body });
  } catch {
    // Notifications may be unavailable in browser/dev — fail silently.
  }
}

export function chatCompleteBody(options: {
  personaDisplay?: string | null;
  diagramUpdated: boolean;
  diagramCreated: boolean;
  error?: string | null;
}): string {
  if (options.error) {
    return "La réponse a échoué — rouvre le chat pour voir le détail.";
  }
  if (options.diagramCreated) {
    return "Nouveau diagramme créé sur le canvas.";
  }
  if (options.diagramUpdated) {
    return "Diagramme mis à jour sur le canvas.";
  }
  const who = options.personaDisplay?.trim() || "L'assistant";
  return `${who} a terminé — ouvre le chat pour lire la réponse.`;
}
