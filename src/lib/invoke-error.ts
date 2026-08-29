/**
 * Extrait le message d'une erreur Tauri invoke (string, Error, ou objet).
 */
export function formatInvokeError(err: unknown, fallback: string): string {
  if (typeof err === "string" && err.trim()) {
    return humanizeOpenRouterError(err.trim());
  }

  if (err instanceof Error && err.message.trim()) {
    return humanizeOpenRouterError(err.message.trim());
  }

  if (err && typeof err === "object") {
    const record = err as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return humanizeOpenRouterError(record.message.trim());
    }
    if (typeof record.data === "string" && record.data.trim()) {
      return humanizeOpenRouterError(record.data.trim());
    }
  }

  return fallback;
}

function humanizeOpenRouterError(raw: string): string {
  const lower = raw.toLowerCase();

  if (lower.includes("404") || lower.includes("no endpoints found")) {
    return "Modèle IA introuvable sur OpenRouter (404). Un modèle de secours sera utilisé au prochain message — relancez l'app si le problème persiste.";
  }

  if (lower.includes("401") || lower.includes("unauthorized") || lower.includes("invalid api key")) {
    return "Clé OpenRouter refusée (401). Vérifiez OPENROUTER_API_KEY dans .env et relancez l'app.";
  }

  if (lower.includes("402") || lower.includes("insufficient") || lower.includes("credit")) {
    return "Crédits OpenRouter insuffisants. Ajoutez des crédits sur openrouter.ai ou utilisez un modèle :free.";
  }

  if (lower.includes("429") || lower.includes("rate limit")) {
    return "Quota OpenRouter dépassé (429). Attendez 1–2 minutes ou changez de modèle :free dans .fun/ai.json.";
  }

  if (lower.includes("erreur réseau") || lower.includes("network") || lower.includes("connection")) {
    return `Connexion OpenRouter impossible : ${raw}`;
  }

  if (raw.startsWith("OpenRouter ")) {
    return raw;
  }

  return raw;
}
