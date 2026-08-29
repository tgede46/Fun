"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { invoke } from "@tauri-apps/api/core";
import { ProjectCard } from "./ProjectCard";

type RecentProject = {
  path: string;
  name: string;
  last_opened: string;
};

type OpenProjectResult = {
  path: string;
  name: string;
  fun_created: boolean;
};

function workshopHref(path: string) {
  return `/workshop?path=${encodeURIComponent(path)}`;
}

export function HomeScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("Mon-projet");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const list = await invoke<RecentProject[]>("get_recent_projects");
        if (!cancelled) {
          setProjects(list);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Impossible de charger les projets récents.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const reloadProjects = useCallback(async () => {
    try {
      const list = await invoke<RecentProject[]>("get_recent_projects");
      setProjects(list);
      setError(null);
    } catch {
      setError("Impossible de charger les projets récents.");
    }
  }, []);

  const openProject = useCallback(
    async (projectPath: string) => {
      try {
        await invoke<OpenProjectResult>("open_project", { projectPath });
        setError(null);
        await reloadProjects();
        router.push(workshopHref(projectPath));
      } catch {
        setError("Impossible d'ouvrir ce projet.");
      }
    },
    [reloadProjects, router],
  );

  const handleOpenFolder = useCallback(async () => {
    setShowCreateForm(false);
    try {
      const picked = await invoke<string | null>("pick_project_folder");
      if (!picked) {
        return;
      }
      await openProject(picked);
    } catch {
      setError("Impossible d'ouvrir le sélecteur de dossier.");
    }
  }, [openProject]);

  const handleCreateProject = useCallback(async () => {
    const name = createName.trim();
    if (!name) {
      setError("Indique un nom pour le projet.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const parent = await invoke<string | null>("pick_project_parent_folder");
      if (!parent) {
        return;
      }

      const result = await invoke<OpenProjectResult>("create_project", {
        parentPath: parent,
        projectName: name,
      });
      await reloadProjects();
      router.push(workshopHref(result.path));
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : "Impossible de créer ce projet.";
      setError(message);
    } finally {
      setCreating(false);
    }
  }, [createName, reloadProjects, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[720px]">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Fun</h1>
          <p className="text-muted-foreground mt-1">Ton atelier desktop — canvas, IA et focus.</p>
        </header>

        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex gap-3 mb-4">
            <button
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              type="button"
              onClick={() => setShowCreateForm((open) => !open)}
            >
              Créer un projet
            </button>
            <button
              className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-accent/50 transition-colors"
              type="button"
              onClick={() => void handleOpenFolder()}
            >
              Ouvrir un dossier
            </button>
          </div>

          {showCreateForm && (
            <form
              className="flex flex-col gap-3 mb-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateProject();
              }}
            >
              <label className="text-sm font-medium text-foreground" htmlFor="project-name">
                Nom du projet
              </label>
              <input
                id="project-name"
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                type="text"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Mon-projet"
                disabled={creating}
              />
              <button
                className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                type="submit"
                disabled={creating}
              >
                {creating ? "Création…" : "Choisir l'emplacement"}
              </button>
            </form>
          )}

          {loading && <p className="text-sm text-muted-foreground">Chargement des projets…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && projects.length === 0 && !error && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun projet récent. Crée un projet ou ouvre un dossier pour commencer.
            </p>
          )}

          {projects.length > 0 && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {projects.map((project) => (
                <li key={project.path}>
                  <ProjectCard
                    name={project.name}
                    path={project.path}
                    onSelect={() => void openProject(project.path)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
