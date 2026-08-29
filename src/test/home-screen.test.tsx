import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { HomeScreen } from "@/components/home/HomeScreen";

// --- Mocks ---

const mockInvoke = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

// Prevent Next.js router from crashing in jsdom (no window.history pushState quirks in our tests)
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  forward: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  isReady: true,
  isFallback: false,
  isPreview: false,
  basePath: "",
  pathname: "/",
  query: {},
  asPath: "/",
  route: "/",
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
}));

// Helper to build a RecentProject-shaped object
function project(path: string, name: string, lastOpened = "1700000000") {
  return { path, name, last_opened: lastOpened };
}

describe("HomeScreen — I/O matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.push.mockReset();
  });

  it("état vide : affiche message calme + CTA visibles, pas d'erreur ni de grille", async () => {
    mockInvoke.mockResolvedValueOnce([]);

    render(<HomeScreen />);

    // Le message vide doit apparaître après le chargement
    await waitFor(() => {
      expect(screen.getByText(/Aucun projet récent./i)).toBeInTheDocument();
    });

    // CTA secondaire « Ouvrir un dossier » présent
    expect(screen.getByRole("button", { name: /Ouvrir un dossier/i })).toBeInTheDocument();

    // Aucun message d'erreur
    expect(screen.queryByText(/Impossible/i)).not.toBeInTheDocument();

    // Pas de grille de projets
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("recents affichés : cartes nom + chemin dans le DOM", async () => {
    const items = [
      project("/home/g/projet-alpha", "projet-alpha"),
      project("/home/g/projet-beta", "projet-beta", "1700000001"),
    ];
    mockInvoke.mockResolvedValueOnce(items);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("projet-alpha")).toBeInTheDocument();
      expect(screen.getByText("/home/g/projet-alpha")).toBeInTheDocument();
      expect(screen.getByText("projet-beta")).toBeInTheDocument();
      expect(screen.getByText("/home/g/projet-beta")).toBeInTheDocument();
    });

    // La liste doit exister une fois les projets rendus
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("clic carte → navigate vers /workshop?path= après invoke open_project", async () => {
    const picked = project("/home/g/mon-projet", "mon-projet");
    mockInvoke
      .mockResolvedValueOnce([picked])
      .mockResolvedValueOnce(picked)
      .mockResolvedValueOnce(picked);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("mon-projet")).toBeInTheDocument();
    });

    // Cliquer sur la carte (button)
    const cardButton = screen.getByRole("button", {
      name: /mon-projet/i,
    });
    cardButton.click();

    // attendre que open_project soit invoqué + reload + navigation
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenNthCalledWith(2, "open_project", {
        projectPath: "/home/g/mon-projet",
      });
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/workshop?path=%2Fhome%2Fg%2Fmon-projet",
      );
    });
  });

  it("clic CTA dossier → annulation = reste sur accueil, aucun open_project", async () => {
    // First call: get_recent_projects → []
    mockInvoke.mockResolvedValueOnce([]);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Ouvrir un dossier/i })).toBeInTheDocument();
    });

    const ctaButton = screen.getByRole("button", { name: /Ouvrir un dossier/i });

    // Simuler l'annulation du sélecteur natif : le mock pour pick_project_folder
    // retourne null lors du clic CTA (handleOpenFolder appelle pick_project_folder)
    // On reset le mock pour que le premier appel (get_recent_projects) soit déjà consumé
    mockInvoke.mockResolvedValueOnce(null);

    ctaButton.click();

    // Vérifier que pick_project_folder a été appelé
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("pick_project_folder");
    });

    // Aucun appel à open_project
    expect(mockInvoke).not.toHaveBeenCalledWith("open_project", expect.anything());

    // Pas de navigation
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
