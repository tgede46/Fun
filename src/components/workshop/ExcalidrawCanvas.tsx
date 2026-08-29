"use client";

import dynamic from "next/dynamic";
import type { ExcalidrawInitialDataState } from "@/lib/diagram";

import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <p className="workshop-canvas__label">Chargement du canvas…</p>
    ),
  },
);

type ExcalidrawCanvasProps = {
  initialData: ExcalidrawInitialDataState;
};

export function ExcalidrawCanvas({ initialData }: ExcalidrawCanvasProps) {
  return (
    <div className="workshop-canvas__embed">
      <Excalidraw initialData={initialData} />
    </div>
  );
}
