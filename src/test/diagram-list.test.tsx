import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CanvasArea } from "@/components/workshop/CanvasArea";
import { DiagramList } from "@/components/workshop/DiagramList";
import type { DiagramListItem } from "@/lib/diagram";

vi.mock("@/canvas/ExcalidrawCanvas", () => ({
  ExcalidrawCanvas: () => null,
}));
vi.mock("@/canvas/drawio/DrawioEmbed", () => ({
  DrawioEmbed: () => null,
}));
vi.mock("@/components/workshop/PlantUmlEditor", () => ({
  PlantUmlEditor: () => null,
}));

const noop = () => {};

function item(
  path: string,
  name: string,
  kind: DiagramListItem["kind"] = "sketch",
): DiagramListItem {
  return { path, name, kind };
}

describe("DiagramList — Story 1.4", () => {
  it("état vide : n'affiche pas de liste", () => {
    const { container } = render(
      <DiagramList diagrams={[]} activePath={null} onSelect={noop} />,
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(container.querySelector("ul")).toBeNull();
  });

  it("liste les diagrammes du projet avec leur nom", () => {
    render(
      <DiagramList
        diagrams={[
          item("/tmp/p/.fun/diagrams/croquis-1.excalidraw", "croquis-1"),
          item("/tmp/p/.fun/diagrams/uml-modele.drawio", "uml-modele", "drawio"),
        ]}
        activePath={null}
        onSelect={noop}
      />,
    );

    expect(screen.getByRole("navigation", { name: /Diagrammes du projet/i })).toBeInTheDocument();
    expect(screen.getByText("Croquis 1")).toBeInTheDocument();
    expect(screen.getByText("UML modele")).toBeInTheDocument();
  });
});

describe("CanvasArea — état vide Story 1.4", () => {
  const baseProps = {
    projectPath: "/tmp/p",
    theme: "light" as const,
    mode: "sketch" as const,
    focusMode: false,
    layersOpen: false,
    onLayersOpenChange: noop,
    activeDiagramPath: null,
    diagramName: null,
    scene: null,
    plantumlSource: null,
    error: null,
    saveError: null,
    codeGenError: null,
    convertMessage: null,
    drawioXml: null,
    onSelectDiagram: noop,
    onSaveError: noop,
    onCreateDrawioDiagram: noop,
  };

  it("sans diagramme : hint Nouveau diagramme", () => {
    render(<CanvasArea {...baseProps} diagrams={[]} />);

    expect(screen.getByText("Commencer à dessiner")).toBeInTheDocument();
    expect(screen.getByText(/Nouveau diagramme/)).toBeInTheDocument();
  });

  it("avec diagrammes mais aucun ouvert : invite à choisir dans la liste", () => {
    render(
      <CanvasArea
        {...baseProps}
        diagrams={[item("/tmp/p/.fun/diagrams/croquis-1.excalidraw", "croquis-1")]}
      />,
    );

    expect(screen.getByText(/Choisissez un diagramme/)).toBeInTheDocument();
    expect(screen.getByText("Croquis 1")).toBeInTheDocument();
  });
});
