export type FunTheme = "light" | "dark" | "electro";

export function parseFunTheme(value: string): FunTheme {
  if (value === "electro") return "electro";
  return value === "dark" ? "dark" : "light";
}

export function toggleFunTheme(theme: FunTheme): FunTheme {
  if (theme === "light") return "dark";
  if (theme === "dark") return "electro";
  return "light";
}

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

const electroTokens: ThemeTokens = {
  canvas: "#0B0B1E",
  surfaceBase: "#0A0A1A",
  surfaceRaised: "#12122A",
  foreground: "#E0F0FF",
  foregroundMuted: "#7A9BBF",
  accent: "#00D4FF",
  border: "#1E3A5F",
  overlayScrim: "rgba(0, 20, 40, 0.75)",
  meditationGlow: "#00D4FF",
};

export function getThemeTokens(theme: FunTheme): ThemeTokens {
  if (theme === "electro") return electroTokens;
  return theme === "dark" ? darkTokens : lightTokens;
}

export function isElectro(theme: FunTheme): boolean {
  return theme === "electro";
}
