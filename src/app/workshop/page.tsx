"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { invoke } from "@tauri-apps/api/core";
import { Suspense, useEffect, useState } from "react";
import { WorkshopLayout } from "@/components/workshop/WorkshopLayout";

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
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!projectPath) {
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
          setResolved(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectPath, router]);

  if (!projectPath) {
    return (
      <main className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-sm text-muted-foreground">Aucun projet sélectionné.</p>
        <Link className="text-sm text-foreground underline hover:opacity-80" href="/">
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  const loading = !resolved;

  if (loading) {
    return (
      <main className="flex items-center justify-center h-screen text-sm text-muted-foreground">
        Ouverture du projet…
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <Link className="text-sm text-foreground underline hover:opacity-80" href="/">
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  const displayName =
    projectName ?? projectPath.split(/[/\\]/).filter(Boolean).pop() ?? "Projet";

  return <WorkshopLayout projectName={displayName} projectPath={projectPath} />;
}

function WorkshopPageInner() {
  const searchParams = useSearchParams();
  const projectPath = searchParams.get("path")?.trim() ?? "none";

  return <WorkshopContent key={projectPath} />;
}

export default function WorkshopPage() {
  return (
    <Suspense
      fallback={
        <main className="flex items-center justify-center h-screen text-sm text-muted-foreground">
          Chargement…
        </main>
      }
    >
      <WorkshopPageInner />
    </Suspense>
  );
}
