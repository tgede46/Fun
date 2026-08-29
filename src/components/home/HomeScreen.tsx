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

  const loadProjects = useCallback(async () => {
    try {
      const list = await invoke<RecentProject[]>("get_recent_projects");
      setProjects(list);
      setError(null);
    } catch {
      setError("Impossible de charger les projets récents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const openProject = useCallback(
    async (projectPath: string) => {
      try {
        await invoke<OpenProjectResult>("open_project", { projectPath });
        setError(null);
        await loadProjects();
        router.push(workshopHref(projectPath));
      } catch {
        setError("Impossible d'ouvrir ce projet.");
      }
    },
    [loadProjects, router],
  );

  const handleOpenFolder = useCallback(async () => {
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

  return (
    <main className="home">
      <header className="home__header">
        <h1>Fun</h1>
        <p>Ton atelier desktop — canvas, IA et focus.</p>
      </header>

      <section className="home__panel">
        <button className="home__cta" type="button" onClick={() => void handleOpenFolder()}>
          Ouvrir un dossier
        </button>

        {loading && <p className="home__hint">Chargement des projets…</p>}
        {error && <p className="home__error">{error}</p>}

        {!loading && projects.length === 0 && !error && (
          <p className="home__empty">
            Aucun projet récent. Ouvre un dossier pour commencer.
          </p>
        )}

        {projects.length > 0 && (
          <ul className="home__grid">
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
    </main>
  );
}
