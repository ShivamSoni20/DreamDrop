import { describe, expect, it } from "vitest";
import { selectDreamdexAdapter } from "./index";

describe("DreamDEX adapter selection", () => {
  it("keeps mock and live implementations explicit", () => {
    expect(selectDreamdexAdapter("mock").dataSource).toBe("mock");
    expect(selectDreamdexAdapter("live").dataSource).toBe("live");
  });

  it("does not silently fall back for an invalid mode", () => {
    expect(() => selectDreamdexAdapter("preview")).toThrow("Unsupported VITE_DATA_MODE");
  });
});
