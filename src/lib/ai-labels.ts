import type { AiStatus } from "@/lib/ai";

export function modelSourceLabel(source: AiStatus["model_source"]): string {
  switch (source) {
    case "benchmark":
      return "choisi par le benchmark";
    case "default":
      return "modèle par défaut";
    default:
      return source;
  }
}

export function shortModelName(modelId: string): string {
  const slash = modelId.lastIndexOf("/");
  const name = slash >= 0 ? modelId.slice(slash + 1) : modelId;
  return name.replace(/:free$/, "");
}
