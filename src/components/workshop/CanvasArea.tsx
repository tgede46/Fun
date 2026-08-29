import type { ExcalidrawInitialDataState } from "@/lib/diagram";
import { ExcalidrawCanvas } from "./ExcalidrawCanvas";

type CanvasAreaProps = {
  diagramName: string | null;
  initialData: ExcalidrawInitialDataState | null;
  error: string | null;
};

export function CanvasArea({
  diagramName,
  initialData,
  error,
}: CanvasAreaProps) {
  if (error) {
    return (
      <section className="workshop-canvas workshop-canvas--empty" aria-label="Canvas">
        <p className="workshop-canvas__error">{error}</p>
      </section>
    );
  }

  if (!initialData) {
    return (
      <section className="workshop-canvas workshop-canvas--empty" aria-label="Canvas">
        <p className="workshop-canvas__label">Nouveau diagramme</p>
        <p className="workshop-canvas__hint">
          Cliquez sur « Nouveau diagramme » dans la barre d&apos;outils pour commencer à
          dessiner.
        </p>
      </section>
    );
  }

  return (
    <section className="workshop-canvas workshop-canvas--active" aria-label="Canvas">
      <p className="workshop-canvas__title">{diagramName}</p>
      <ExcalidrawCanvas initialData={initialData} />
    </section>
  );
}
