import type { FunObject } from "../types";
import type { UMLClassObject } from "../types";

export function useCreateUMLTools({ onAdd }: { onAdd: (obj: FunObject) => void }) {
  const tools: Record<string, (e: React.PointerEvent, sx: number, sy: number) => void> = {};

  tools["uml-class"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: UMLClassObject = {
      id,
      x: sx - 60,
      y: sy - 50,
      width: 120,
      height: 100,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      name: "ClassName",
      stereotype: undefined,
      attributes: ["+ attr: type"],
      methods: ["+ method()"],
      compartmentsVisible: true,
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-interface"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 60,
      y: sy - 40,
      width: 120,
      height: 80,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-interface",
      name: "InterfaceName",
      stereotype: "<<Interface>>",
      attributes: [],
      methods: ["+ method()"],
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-abstract-class"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 60,
      y: sy - 45,
      width: 120,
      height: 90,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-abstract-class",
      name: "AbstractClass",
      stereotype: "<<Abstract>>",
      attributes: [],
      methods: ["+ doSomething()"],
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-enum"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 50,
      y: sy - 30,
      width: 100,
      height: 60,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-enum",
      name: "EnumName",
      values: ["VALUE_1", "VALUE_2"],
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-actor"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 40,
      y: sy - 40,
      width: 80,
      height: 80,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-actor",
      name: "ActorName",
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-usecase"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 30,
      y: sy - 30,
      width: 60,
      height: 60,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-usecase",
      name: "Use Case",
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-state"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 30,
      y: sy - 30,
      width: 60,
      height: 60,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-state",
      name: "StateName",
      stereotype: undefined,
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-component"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 50,
      y: sy - 35,
      width: 100,
      height: 80,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-component",
      name: "Component",
      stereotype: undefined,
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-node"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 35,
      y: sy - 30,
      width: 70,
      height: 60,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-node",
      name: "NodeName",
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-database"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 40,
      y: sy - 35,
      width: 80,
      height: 70,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-database",
      name: "Database",
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-package"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 30,
      y: sy - 25,
      width: 60,
      height: 50,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-package",
      name: "PackageName",
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-note"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 40,
      y: sy - 35,
      width: 80,
      height: 70,
      fill: "#fffde7",
      stroke: "#9e9e9e",
      strokeWidth: 2,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-note",
      text: "Note text here",
      fontSize: 14,
    };
    onAdd(obj);
  };

  tools["uml-boundary"] = (e, sx, sy) => {
    if (e.button !== 0) return;
    const id = crypto.randomUUID();
    const obj: FunObject = {
      id,
      x: sx - 80,
      y: sy - 60,
      width: 160,
      height: 120,
      fill: "transparent",
      stroke: "#1e1e1e",
      strokeWidth: 2.5,
      opacity: 1,
      locked: false,
      zIndex: 0,
      type: "uml-boundary",
      name: "System Boundary",
      fontSize: 14,
    };
    onAdd(obj);
  };

  return tools;
}
