type ModeRailProps = {
  activeMode?: "sketch" | "uml";
};

export function ModeRail({ activeMode = "sketch" }: ModeRailProps) {
  return (
    <nav className="workshop-rail" aria-label="Modes atelier">
      <button
        className={`workshop-rail__btn${activeMode === "sketch" ? " workshop-rail__btn--active" : ""}`}
        type="button"
        title="Sketch"
        aria-label="Mode Sketch"
        aria-pressed={activeMode === "sketch"}
      >
        ✎
      </button>
      <button
        className={`workshop-rail__btn${activeMode === "uml" ? " workshop-rail__btn--active" : ""}`}
        type="button"
        title="UML"
        aria-label="Mode UML"
        aria-pressed={activeMode === "uml"}
      >
        ◫
      </button>
    </nav>
  );
}
