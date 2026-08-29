"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { invoke } from "@tauri-apps/api/core";
import { Suspense, useEffect, useState } from "react";

type OpenProjectResult = {
  path: string;
  name: string;
  fun_created: boolean;
};

function WorkshopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectPath = searchParams.get("path")?.trim() ?? null;
  const [projectName, setProjectName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(projectPath));

  useEffect(() => {
    if (!projectPath) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await invoke<OpenProjectResult>("open_project", {
          projectPath,
        });
        if (!cancelled) {
          setProjectName(result.name);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Impossible d'ouvrir ce projet.");
          router.replace("/");
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
  }, [projectPath, router]);

  if (!projectPath) {
    return (
      <main className="workshop">
        <p className="workshop__hint">Aucun projet sélectionné.</p>
        <Link className="workshop__back" href="/">
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  if (loading) {
    return <main className="workshop">Ouverture du projet…</main>;
  }

  if (error) {
    return (
      <main className="workshop">
        <p className="workshop__error">{error}</p>
        <Link className="workshop__back" href="/">
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  const displayName =
    projectName ?? projectPath.split(/[/\\]/).filter(Boolean).pop() ?? "Projet";

  return (
    <main className="workshop">
      <header className="workshop__header">
        <p className="workshop__eyebrow">Atelier</p>
        <h1>{displayName}</h1>
        <p className="workshop__path">{projectPath}</p>
      </header>
      <p className="workshop__hint">
        Canvas, chat et Pomodoro arrivent dans les prochaines stories.
      </p>
      <Link className="workshop__back" href="/">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}

export default function WorkshopPage() {
  return (
    <Suspense fallback={<main className="workshop">Chargement…</main>}>
      <WorkshopContent />
    </Suspense>
  );
}
