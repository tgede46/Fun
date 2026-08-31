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

  return name.replace(/-/g, " ");
}
