import type { Action, ActionContext, ActionResult, ActionName } from "./types";
import { isInputLike } from "./keys";

export class ActionManager {
  private actions = new Map<ActionName, Action>();

  register(action: Action): void {
    this.actions.set(action.name, action);
  }

  registerAll(actions: Action[]): void {
    for (const action of actions) {
      this.register(action);
    }
  }

  getAction(name: ActionName): Action | undefined {
    return this.actions.get(name);
  }

  handleKeyDown(
    event: KeyboardEvent | React.KeyboardEvent,
    context: ActionContext,
    execute: (action: Action, source: "keyboard") => void,
  ): void {
    if (isInputLike(event.target as Element)) {
      return;
    }

    const matchingActions: { action: Action; priority: number }[] = [];

    for (const action of this.actions.values()) {
      if (action.keyTest) {
        if (action.predicate && !action.predicate(context)) {
          continue;
        }
        if (action.keyTest(event, context)) {
          matchingActions.push({
            action,
            priority: action.priority ?? 0,
          });
        }
      }
    }

    if (matchingActions.length === 0) return;

    matchingActions.sort((a, b) => b.priority - a.priority);

    const bestMatch = matchingActions[0];
    event.preventDefault();
    execute(bestMatch.action, "keyboard");
  }

  executeAction(
    action: Action,
    context: ActionContext,
    _source?: ActionSource,
  ): ActionResult | void {
    void _source;
    if (action.predicate && !action.predicate(context)) {
      return;
    }
    return action.perform(context);
  }
}

export type ActionSource = "ui" | "keyboard" | "contextMenu";
