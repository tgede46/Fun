export type FunTheme = "light" | "dark";

export type ThemeTokens = {
  canvas: string;
  surfaceBase: string;
  surfaceRaised: string;
  foreground: string;
  foregroundMuted: string;
  accent: string;
  border: string;
  overlayScrim: string;
  meditationGlow: string;
};

const lightTokens: ThemeTokens = {
  canvas: "#FFFFFF",
  surfaceBase: "#F5F0E8",
  surfaceRaised: "#FFFFFF",
  foreground: "#1A1A1A",
  foregroundMuted: "#5C5C5C",
  accent: "#1A1A1A",
  border: "#E0D8CC",
  overlayScrim: "rgba(26, 26, 26, 0.35)",
  meditationGlow: "#F5F0E8",
};

const darkTokens: ThemeTokens = {
  canvas: "#1E1E1E",
  surfaceBase: "#0D0D0D",
  surfaceRaised: "#1A1A1A",
  foreground: "#F5F0E8",
  foregroundMuted: "#A8A096",
  accent: "#F5F0E8",
  border: "#2E2E2E",
  overlayScrim: "rgba(0, 0, 0, 0.55)",
  meditationGlow: "#2A2824",
};

export function getThemeTokens(theme: FunTheme): ThemeTokens {
  return theme === "dark" ? darkTokens : lightTokens;
}
