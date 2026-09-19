import { describe, expect, it } from "vitest";
import { chatCompleteBody } from "@/lib/chat-notify";

describe("chat companion notify copy", () => {
  it("signals error for closed-overlay failure path", () => {
    expect(
      chatCompleteBody({
        diagramUpdated: false,
        diagramCreated: false,
        error: "failed",
      }),
    ).toMatch(/échoué/i);
  });

  it("mentions canvas when diagram updated", () => {
    expect(
      chatCompleteBody({
        diagramUpdated: true,
        diagramCreated: false,
      }),
    ).toMatch(/Diagramme mis à jour/);
  });
});
