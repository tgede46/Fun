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
    <main className="home">
      <header className="home__header">
        <h1>Fun</h1>
        <p>Ton atelier desktop — canvas, IA et focus.</p>
      </header>

      <section className="home__panel">
        <div className="home__actions">
          <button
            className="home__cta"
            type="button"
            onClick={() => setShowCreateForm((open) => !open)}
          >
            Créer un projet
          </button>
          <button
            className="home__cta home__cta--secondary"
            type="button"
            onClick={() => void handleOpenFolder()}
          >
            Ouvrir un dossier
          </button>
        </div>

        {showCreateForm && (
          <form
            className="home__create"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateProject();
            }}
          >
            <label className="home__create-label" htmlFor="project-name">
              Nom du projet
            </label>
            <input
              id="project-name"
              className="home__create-input"
              type="text"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="Mon-projet"
              disabled={creating}
            />
            <button className="home__cta" type="submit" disabled={creating}>
              {creating ? "Création…" : "Choisir l'emplacement"}
            </button>
          </form>
        )}

        {loading && <p className="home__hint">Chargement des projets…</p>}
        {error && <p className="home__error">{error}</p>}

        {!loading && projects.length === 0 && !error && (
          <p className="home__empty">
            Aucun projet récent. Crée un projet ou ouvre un dossier pour commencer.
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
