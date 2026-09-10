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
import { autoLayoutScene } from "../utils/autoLayout";

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

// ─── Détection activité ───

function looksLikeActivityDiagram(puml: string): boolean {
  const body = puml
    .replace(/@startuml[^\n]*/gi, "")
    .replace(/@enduml/gi, "");
  if (/\b(class|interface|enum|component|actor|usecase)\s+\S+/i.test(body)) {
    return false;
  }
  return (
    /^\s*(start|stop|end)\s*$/im.test(body) ||
    /^\s*:[^;]+;/m.test(body) ||
    /^\s*if\s*\(/im.test(body) ||
    /^\s*(while|repeat)\b/im.test(body)
  );
}

/** Parse diagrammes d'activité PlantUML (start / :action; / if / while / stop). */
function parseActivityDiagram(puml: string): {
  entities: PumlEntity[];
  relations: PumlRelation[];
  notes: string[];
} {
  const lines = puml.split(/\r?\n/);
  const entities: PumlEntity[] = [];
  const relations: PumlRelation[] = [];
  let uuidCounter = 0;
  const nextId = () => `puml-act-${++uuidCounter}`;
  const nameCount = new Map<string, number>();

  const uniqueName = (raw: string) => {
    const base = raw.replace(/\\n/g, "\n").trim() || "étape";
    const n = (nameCount.get(base) ?? 0) + 1;
    nameCount.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  };

  const addEntity = (
    type: PumlEntity["type"],
    label: string,
  ): PumlEntity => {
    const entity: PumlEntity = {
      id: nextId(),
      type,
      name: uniqueName(label),
      attributes: [],
      methods: [],
    };
    entities.push(entity);
    return entity;
  };

  let lastName: string | null = null;
  let pendingLabel: string | undefined;
  type IfFrame = {
    kind: "if";
    decisionName: string;
    thenEnd: string | null;
    elseStarted: boolean;
  };
  type RepeatFrame = { kind: "repeat"; startName: string };
  type WhileFrame = {
    kind: "while";
    decisionName: string;
    bodyLabel?: string;
  };
  const stack: Array<IfFrame | RepeatFrame | WhileFrame> = [];

  const link = (toName: string) => {
    if (lastName) {
      relations.push({
        from: lastName,
        to: toName,
        kind: "transition",
        label: pendingLabel,
      });
    }
    pendingLabel = undefined;
    lastName = toName;
  };

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line.startsWith("'") || line.startsWith("@startuml") || line.startsWith("@enduml")) {
      continue;
    }
    // Continuer une action multi-ligne : ":foo\nbar;" → déjà sur une ligne souvent avec \n
    if (line.endsWith("\\")) {
      continue;
    }

    // Étiquette de transition seule : ->non;
    const aloneArrow = line.match(/^->\s*([^;]*);?\s*$/);
    if (aloneArrow) {
      pendingLabel = aloneArrow[1].trim() || undefined;
      continue;
    }

    if (/^start$/i.test(line)) {
      const node = addEntity("state", "start");
      lastName = node.name;
      continue;
    }

    if (/^(stop|end)$/i.test(line)) {
      const node = addEntity("state", line.toLowerCase());
      link(node.name);
      continue;
    }

    // :Action;
    const actionMatch = line.match(/^:(.+);$/);
    if (actionMatch) {
      const node = addEntity("state", actionMatch[1].trim());
      link(node.name);
      continue;
    }

    // if (cond) then (yes)
    const ifMatch = line.match(
      /^if\s*\((.+)\)\s*then(?:\s*\(([^)]*)\))?\s*$/i,
    );
    if (ifMatch) {
      const node = addEntity("state", ifMatch[1].trim());
      link(node.name);
      stack.push({
        kind: "if",
        decisionName: node.name,
        thenEnd: null,
        elseStarted: false,
      });
      pendingLabel = ifMatch[2]?.trim() || "oui";
      continue;
    }

    // else (no)
    const elseMatch = line.match(/^else(?:\s*\(([^)]*)\))?\s*$/i);
    if (elseMatch) {
      const frame = [...stack].reverse().find((f) => f.kind === "if") as
        | IfFrame
        | undefined;
      if (frame) {
        frame.thenEnd = lastName;
        frame.elseStarted = true;
        lastName = frame.decisionName;
        pendingLabel = elseMatch[1]?.trim() || "non";
      }
      continue;
    }

    if (/^endif$/i.test(line)) {
      const idx = stack.map((f) => f.kind).lastIndexOf("if");
      if (idx >= 0) {
        const frame = stack[idx] as IfFrame;
        stack.splice(idx, 1);
        // Point de fusion : si les deux branches existent, on garde lastName
        // (branche else). La branche then reste reliée à son stop/fin.
        if (frame.thenEnd && frame.elseStarted && lastName) {
          // noop — graphe déjà correct
        } else if (frame.thenEnd && !frame.elseStarted) {
          lastName = frame.thenEnd;
        }
      }
      continue;
    }

    // while (cond) is (yes)
    const whileMatch = line.match(
      /^while\s*\((.+)\)(?:\s*is\s*\(([^)]*)\))?\s*$/i,
    );
    if (whileMatch) {
      const node = addEntity("state", whileMatch[1].trim());
      link(node.name);
      stack.push({
        kind: "while",
        decisionName: node.name,
        bodyLabel: whileMatch[2]?.trim() || "oui",
      });
      pendingLabel = whileMatch[2]?.trim() || "oui";
      continue;
    }

    // endwhile (no)
    const endwhileMatch = line.match(/^endwhile(?:\s*\(([^)]*)\))?\s*$/i);
    if (endwhileMatch) {
      const idx = stack.map((f) => f.kind).lastIndexOf("while");
      if (idx >= 0) {
        const frame = stack[idx] as WhileFrame;
        stack.splice(idx, 1);
        if (lastName) {
          relations.push({
            from: lastName,
            to: frame.decisionName,
            kind: "transition",
            label: frame.bodyLabel,
          });
        }
        lastName = frame.decisionName;
        pendingLabel = endwhileMatch[1]?.trim() || "non";
      }
      continue;
    }

    if (/^repeat$/i.test(line)) {
      // Ancre de début de boucle = dernier nœud (ou nœud dédié)
      if (!lastName) {
        const node = addEntity("state", "repeat");
        lastName = node.name;
      }
      stack.push({ kind: "repeat", startName: lastName });
      continue;
    }

    // repeat while (cond) is (yes)
    const repeatWhileMatch = line.match(
      /^repeat\s+while\s*\((.+)\)(?:\s*is\s*\(([^)]*)\))?\s*$/i,
    );
    if (repeatWhileMatch) {
      const node = addEntity("state", repeatWhileMatch[1].trim());
      link(node.name);
      const idx = stack.map((f) => f.kind).lastIndexOf("repeat");
      if (idx >= 0) {
        const frame = stack[idx] as RepeatFrame;
        stack.splice(idx, 1);
        relations.push({
          from: node.name,
          to: frame.startName,
          kind: "transition",
          label: repeatWhileMatch[2]?.trim() || "oui",
        });
      }
      pendingLabel = undefined;
      // sortie de boucle : la suite part de la décision
      lastName = node.name;
      continue;
    }

    // fork / end fork — chaînage simple
    if (/^fork$/i.test(line) || /^end\s*fork$/i.test(line)) {
      continue;
    }
  }

  return { entities, relations, notes: [] };
}

// ─── Parseur PlantUML (MVP simple) ───

function parsePumlDefs(puml: string): { entities: PumlEntity[]; relations: PumlRelation[]; notes: string[] } {
  if (looksLikeActivityDiagram(puml)) {
    return parseActivityDiagram(puml);
  }

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
      const name = nameRaw.trim().replace(/[{}]$/g, "").trim();
      if (line.includes("{") && !line.includes("}")) {
        currentBlock = { type, name, lines: [] };
      } else {
        entities.push(buildEntityFromBlock({ type, name, lines: [] }, nextId()));
      }
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

  if (currentBlock) {
    entities.push(buildEntityFromBlock(currentBlock, nextId()));
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

  return autoLayoutScene({
    objects,
    edges,
    metadata: { sourceFormat: "plantuml", ...metadata },
  });
}

function objectExportName(obj: FunObject): string {
  if ("name" in obj && typeof (obj as { name?: string }).name === "string") {
    return (obj as { name: string }).name;
  }
  if (obj.type === "text") return (obj as { text: string }).text;
  if (obj.type === "uml-note") return (obj as { text: string }).text;
  return obj.id;
}

export function funSceneToPlantUml(scene: FunScene): string {
  const lines: string[] = ["@startuml", ""];
  const names = new Map<string, string>();

  for (const obj of scene.objects) {
    names.set(obj.id, objectExportName(obj));
    switch (obj.type) {
      case "uml-class": {
        const e = obj as { name: string; stereotype?: string; attributes?: string[]; methods?: string[] };
        const stereotype = e.stereotype ? ` <<${e.stereotype}>>` : "";
        lines.push(`class ${e.name}${stereotype} {`);
        for (const attr of e.attributes ?? []) lines.push(`  ${attr}`);
        for (const method of e.methods ?? []) lines.push(`  ${method}`);
        lines.push("}");
        break;
      }
      case "uml-interface": {
        const e = obj as { name: string; methods?: string[] };
        lines.push(`interface ${e.name} {`);
        for (const method of e.methods ?? []) lines.push(`  ${method}`);
        lines.push("}");
        break;
      }
      case "uml-abstract-class":
        lines.push(`abstract class ${(obj as { name: string }).name}`);
        break;
      case "uml-enum":
        lines.push(`enum ${(obj as { name: string }).name}`);
        break;
      case "uml-component":
        lines.push(`component ${(obj as { name: string }).name}`);
        break;
      case "uml-database":
        lines.push(`database ${(obj as { name: string }).name}`);
        break;
      case "uml-package":
        lines.push(`package ${(obj as { name: string }).name} {`);
        lines.push("}");
        break;
      case "uml-actor":
        lines.push(`actor ${(obj as { name: string }).name}`);
        break;
      case "uml-usecase":
        lines.push(`usecase ${(obj as { name: string }).name}`);
        break;
      case "uml-state":
        lines.push(`state ${(obj as { name: string }).name}`);
        break;
      case "uml-note":
        lines.push(`note "${(obj as { text: string }).text}"`);
        break;
      case "text":
        lines.push(`class ${(obj as { text: string }).text || obj.id}`);
        break;
      case "rect":
      case "ellipse":
      case "diamond":
        lines.push(`class ${obj.label || obj.id}`);
        break;
      default:
        break;
    }
  }

  for (const edge of scene.edges ?? []) {
    let arrow = "--";
    switch (edge.kind) {
      case "inheritance":
        arrow = "--|>";
        break;
      case "implementation":
        arrow = "..|>";
        break;
      case "aggregation":
        arrow = "o--";
        break;
      case "composition":
        arrow = "*--";
        break;
      case "dependency":
        arrow = "..>";
        break;
      case "notes-link":
        arrow = "..";
        break;
      default:
        arrow = "-->";
    }
    const from = names.get(edge.fromId) ?? edge.fromId;
    const to = names.get(edge.toId) ?? edge.toId;
    if (edge.label) {
      lines.push(`${from} ${arrow} ${to} : ${edge.label}`);
    } else {
      lines.push(`${from} ${arrow} ${to}`);
    }
  }

  lines.push("", "@enduml");
  return lines.join("\n");
}
