import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/workshop/ThemeToggle";
import { parseFunTheme, toggleFunTheme } from "@/lib/theme";

describe("ThemeToggle — Story 2.5 électro", () => {
  it("cycle clair → sombre → électro", () => {
    expect(toggleFunTheme("light")).toBe("dark");
    expect(toggleFunTheme("dark")).toBe("electro");
    expect(toggleFunTheme("electro")).toBe("light");
    expect(parseFunTheme("electro")).toBe("electro");
  });

  it("affiche le thème courant et le suivant", () => {
    const onToggle = vi.fn();
    render(<ThemeToggle theme="dark" onToggle={onToggle} />);

    expect(screen.getByRole("button", { name: /Basculer vers le thème électro/i })).toBeInTheDocument();
    expect(screen.getByText(/sombre → électro/)).toBeInTheDocument();

    screen.getByRole("button").click();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
