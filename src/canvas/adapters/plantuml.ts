/**
 * Adaptateur PlantUML (texte) → FunScene
 *
 * Parse le texte PlantUML pour extraire les entités (classes, interfaces, composants,
 * notes, etc.) et leurs relations, puis les convertit en FunObject + EdgeObject.
 *
 * Limitations MVP :
 * - Syntaxe simplifiée : ne parse pas les blocs complets avec méthodes/attributs détaillés
 * - Ne gère pas les skins, les sprites, les notes complexes
 * - La disposition (positionnement) est générée automatiquement verticale
 *
 * Approche : parser les définitions de haut niveau et les relations, ignorer le reste.
 */

import type { FunObject, FunScene, EdgeObject, DiagramMetadata, BaseObject } from "../types";

// ─── Types internes ───

interface PumlEntity {
  id: string;
  type: "class" | "interface" | "abstract-class" | "enum" | "component" | "node" | "database" | "package" | "note" | "actor" | "usecase" | "state" | "boundary";
  name: string;
  stereotype?: string;
  attributes: string[];
  methods: string[];
  values?: string[];
}

interface PumlRelation {
  from: string;
  to: string;
  kind: "association" | "inheritance" | "implementation" | "aggregation" | "composition" | "dependency" | "notes-link" | "transition";
  label?: string;
  points?: { x: number; y: number }[];
}

// ─── Parseur PlantUML (MVP simple) ───

function parsePumlDefs(puml: string): { entities: PumlEntity[]; relations: PumlRelation[]; notes: string[] } {
  const lines = puml.split(/\r?\n/);
  const entities: PumlEntity[] = [];
  const relations: PumlRelation[] = [];
  const notes: string[] = [];

  let currentBlock: { type: string; name: string; lines: string[] } | null = null;

  // UUID simple pour garantir des IDs uniques
  let uuidCounter = 0;
  const nextId = () => `puml-${++uuidCounter}`;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("@startuml") || line.startsWith("@enduml")) continue;

    // Début de bloc class/interface/etc.
    const blockStart = line.match(/^(class|interface|abstract class|enum|component|node|database|package|note|actor|usecase|state|boundary)\s+([{}"]?)(.+?)\2\s*(?:\{)?$/);
    if (blockStart) {
      const [, typeRaw, , nameRaw] = blockStart;
      const type = normalizePumlType(typeRaw);
      const name = nameRaw.trim();
      currentBlock = { type, name, lines: [] };
      continue;
    }

    if (currentBlock) {
      // Fin de bloc
      if (line === "}" || line === "") {
        if (currentBlock.lines.length > 0) {
          const entity = buildEntityFromBlock(currentBlock, nextId());
          entities.push(entity);
        }
        currentBlock = null;
        continue;
      }

      currentBlock.lines.push(line);
      continue;
    }

    // Relation simple : A -- B : label
    const relMatch = line.match(/^([\w\.$]+)\s*([-*o#]{1,3}>?|-->?|:>|\..*?>)\s*([\w\.$]+)\s*(?::\s*(.+))?$/);
    if (relMatch) {
      const [, fromRaw, arrowRaw, toRaw, labelRaw] = relMatch;
      const kind = arrowToRelationKind(arrowRaw);
      relations.push({
        from: fromRaw.trim(),
        to: toRaw.trim(),
        kind,
        label: labelRaw?.trim(),
      });
      continue;
    }

    // Note simple
    if (line.startsWith("note")) {
      notes.push(line);
      continue;
    }

    // Note attachée : note right of X : texte
    const noteAttachMatch = line.match(/^note\s+(right|left|top|bottom)\s+of\s+([\w\.$]+)\s*:\s*(.+)$/);
    if (noteAttachMatch) {
      const [, , targetRaw, textRaw] = noteAttachMatch;
      notes.push(`note_${targetRaw.trim()}: ${textRaw.trim()}`);
      continue;
    }
  }

  return { entities, relations, notes };
}

function normalizePumlType(raw: string): PumlEntity["type"] {
  const map: Record<string, PumlEntity["type"]> = {
    class: "class",
    interface: "interface",
    "abstract class": "abstract-class",
    enum: "enum",
    component: "component",
    node: "node",
    database: "database",
    package: "package",
    note: "note",
    actor: "actor",
    usecase: "usecase",
    state: "state",
    boundary: "boundary",
  };
  return map[raw] ?? "class";
}

function arrowToRelationKind(arrow: string): PumlRelation["kind"] {
  if (arrow.includes("-->") || arrow.endsWith(">")) return "dependency";
  if (arrow.includes("--|>") || arrow.includes("--*")) return "implementation";
  if (arrow.includes("-*") || arrow.includes("--o")) return "aggregation";
  if (arrow.includes("-o") || arrow.includes("o--")) return "aggregation";
  if (arrow.includes("-o-") || arrow.includes("o--o")) return "aggregation";
  if (arrow.includes("*-")) return "composition";
  if (arrow.includes("--|") || arrow.includes("--")) return "association";
  if (arrow.includes("..")) return "dependency";
  return "association";
}

function buildEntityFromBlock(block: { type: string; name: string; lines: string[] }, id: string): PumlEntity {
  const attributes: string[] = [];
  const methods: string[] = [];

  for (const line of block.lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "}") continue;

    // Détermine si c'est un attribut ou une méthode par la présence de () ou de ; en fin
    if (trimmed.includes("(") || trimmed.endsWith(")")) {
      methods.push(trimmed);
    } else {
      attributes.push(trimmed);
    }
  }

  return {
    id,
    type: normalizePumlType(block.type),
    name: block.name,
    attributes,
    methods,
  };
}

// ─── Conversion entité → FunObject ───

function pumlEntityToFunObject(entity: PumlEntity): FunObject {
  const base: BaseObject = {
    id: entity.id,
    x: 0,
    y: 0,
    width: 120,
    height: 80,
    fill: "transparent",
    stroke: "#1e1e1e",
    strokeWidth: 2,
    opacity: 1,
    locked: false,
    zIndex: 0,
  };

  switch (entity.type) {
    case "class":
      return {
        ...base,
        type: "uml-class",
        name: entity.name,
        stereotype: entity.stereotype,
        attributes: entity.attributes,
        methods: entity.methods,
        compartmentsVisible: true,
        fontSize: 14,
      };
    case "interface":
      return {
        ...base,
        type: "uml-interface",
        name: entity.name,
        stereotype: entity.stereotype,
        attributes: entity.attributes,
        methods: entity.methods,
        fontSize: 14,
      };
    case "abstract-class":
      return {
        ...base,
        type: "uml-abstract-class",
        name: entity.name,
        stereotype: entity.stereotype,
        attributes: entity.attributes,
        methods: entity.methods,
        fontSize: 14,
      };
    case "enum":
      return {
        ...base,
        type: "uml-enum",
        name: entity.name,
        values: entity.values ?? [],
        fontSize: 14,
      };
    case "component":
      return {
        ...base,
        type: "uml-component",
        name: entity.name,
        stereotype: entity.stereotype,
        fontSize: 14,
      };
    case "node":
      return {
        ...base,
        type: "uml-node",
        name: entity.name,
        fontSize: 14,
      };
    case "database":
      return {
        ...base,
        type: "uml-database",
        name: entity.name,
        fontSize: 14,
      };
    case "package":
      return {
        ...base,
        type: "uml-package",
        name: entity.name,
        fontSize: 14,
      };
    case "note":
      return {
        ...base,
        type: "uml-note",
        text: entity.name,
        fontSize: 14,
      };
    case "actor":
      return {
        ...base,
        type: "uml-actor",
        name: entity.name,
        fontSize: 14,
      };
    case "usecase":
      return {
        ...base,
        type: "uml-usecase",
        name: entity.name,
        fontSize: 14,
      };
    case "state":
      return {
        ...base,
        type: "uml-state",
        name: entity.name,
        stereotype: entity.stereotype,
        fontSize: 14,
      };
    case "boundary":
      return {
        ...base,
        type: "uml-boundary",
        name: entity.name,
        fontSize: 14,
      };
    default:
      return {
        ...base,
        type: "uml-class",
        name: entity.name,
        stereotype: entity.stereotype,
        attributes: entity.attributes,
        methods: entity.methods,
        compartmentsVisible: true,
        fontSize: 14,
      };
  }
}

function kindToPumlKind(kind: PumlRelation["kind"]): "association" | "inheritance" | "implementation" | "aggregation" | "composition" | "dependency" | "notes-link" | "transition" {
  return kind;
}

function pumlRelationToEdge(relation: PumlRelation, fromId: string, toId: string): EdgeObject {
  const base: BaseObject = {
    id: `edge-${fromId}-${toId}`,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fill: "transparent",
    stroke: "#1e1e1e",
    strokeWidth: 2,
    opacity: 1,
    locked: false,
    zIndex: 0,
  };

  // Points par défaut : ligne droite (sera redessinée par le canvas)
  const points: { x: number; y: number }[] = [];

  return {
    ...base,
    type: "edge",
    fromId,
    toId,
    kind: kindToPumlKind(relation.kind),
    points,
    label: relation.label,
  };
}

// ─── Export principal ───

export function plantumlToFunScene(
  puml: string,
  metadata?: DiagramMetadata
): FunScene {
  const { entities, relations, notes } = parsePumlDefs(puml);

  // Créer un dictionnaire de noms → IDs pour les relations
  const idMap = new Map<string, string>();
  for (const entity of entities) {
    idMap.set(entity.name, entity.id);
  }

  const objects: FunObject[] = entities.map((e) => pumlEntityToFunObject(e));

  const edges: EdgeObject[] = relations
    .filter((r) => idMap.has(r.from) && idMap.has(r.to))
    .map((r) => pumlRelationToEdge(r, idMap.get(r.from)!, idMap.get(r.to)!));

  // Notes : on les ajoute comme objets note si on peut identifier la cible
  for (const note of notes) {
    const parts = note.split(":");
    if (parts.length >= 2) {
      const targetPart = parts[0].trim().replace(/^note_\s*/, "");
      const textPart = parts.slice(1).join(":").trim();
      if (idMap.has(targetPart)) {
        objects.push({
          id: `note-${idMap.get(targetPart)}-${Date.now()}`,
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          fill: "transparent",
          stroke: "#1e1e1e",
          strokeWidth: 2,
          opacity: 1,
          locked: false,
          zIndex: 0,
          type: "uml-note",
          text: textPart,
          fontSize: 14,
        });
      } else {
        // Note orpheline : on l'ajoute quand même
        objects.push({
          id: `note-orphan-${Date.now()}`,
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          fill: "transparent",
          stroke: "#1e1e1e",
          strokeWidth: 2,
          opacity: 1,
          locked: false,
          zIndex: 0,
          type: "uml-note",
          text: note,
          fontSize: 14,
        });
      }
    }
  }

  return {
    objects,
    edges,
    metadata: { sourceFormat: "plantuml", ...metadata },
  };
}
