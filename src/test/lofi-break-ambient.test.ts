import { describe, expect, it } from "vitest";
import {
  LOFI_BREAK_SOFT_FACTOR,
  lofiEffectiveVolume,
} from "@/hooks/useLofiAmbient";

describe("lofiEffectiveVolume", () => {
  it("is full volume during work", () => {
    expect(lofiEffectiveVolume(40, "full", false)).toBeCloseTo(0.4);
  });

  it("ducks during break", () => {
    expect(lofiEffectiveVolume(40, "soft", false)).toBeCloseTo(
      0.4 * LOFI_BREAK_SOFT_FACTOR,
    );
  });

  it("is silent when off or muted", () => {
    expect(lofiEffectiveVolume(40, "off", false)).toBe(0);
    expect(lofiEffectiveVolume(40, "full", true)).toBe(0);
    expect(lofiEffectiveVolume(40, "soft", true)).toBe(0);
  });
});
