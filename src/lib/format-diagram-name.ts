/** Affiche un nom de fichier diagramme de façon lisible. */
export function formatDiagramName(name: string): string {
  const croquis = name.match(/^croquis-(\d+)$/i);
  if (croquis) {
    return `Croquis ${croquis[1]}`;
  }

  const sketch = name.match(/^sketch-(\d{8})-(\d+)/);
  if (sketch) {
    const raw = sketch[1];
    const day = raw.slice(6, 8);
    const month = raw.slice(4, 6);
    return `Croquis ${day}/${month}`;
  }

  const uml = name.match(/^uml-(.+)$/i);
  if (uml) {
    return `UML ${uml[1].replace(/-/g, " ")}`;
  }

  const plantuml = name.match(/^plantuml-(\d+)$/i);
  if (plantuml) {
    return `PlantUML ${plantuml[1]}`;
  }

  const capture = name.match(/^capture-(\d+)$/i);
  if (capture) {
    return `Capture ${capture[1]}`;
  }

  return name.replace(/-/g, " ");
}
