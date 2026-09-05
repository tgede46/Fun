import type { FunTheme } from "@/lib/theme";

type ThemeToggleProps = {
  theme: FunTheme;
  onToggle: () => void;
  projectPath?: string;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const labels: Record<FunTheme, string> = {
    light: "clair",
    dark: "sombre",
    electro: "électro",
  };

  const next: FunTheme = theme === "light" ? "dark" : theme === "dark" ? "electro" : "light";
  const nextLabel = labels[next];

  return (
    <button
      type="button"
      className="px-2 py-1 text-xs rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
      onClick={onToggle}
      title={`Prochain thème : ${nextLabel}`}
      aria-label={`Basculer vers le thème ${nextLabel}`}
    >
      <span className="inline-block w-3 h-3 rounded-full bg-current opacity-70 align-middle mr-1" />
      {labels[theme]} → {nextLabel}
    </button>
  );
}
