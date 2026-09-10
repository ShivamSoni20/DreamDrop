import { appConfig } from "@/lib/config";
import { createLiveDreamdexAdapter } from "./liveDreamdexAdapter";
import { createMockDreamdexAdapter } from "./mockDreamdexAdapter";
import type { DreamdexAdapter } from "./types";

export type DreamdexDataMode = "mock" | "live";

export function selectDreamdexAdapter(mode: string): DreamdexAdapter {
  if (mode === "mock") return createMockDreamdexAdapter();
  if (mode === "live") return createLiveDreamdexAdapter();
  throw new Error(`Unsupported VITE_DATA_MODE: ${mode}`);
}

export const dreamdexAdapter = selectDreamdexAdapter(appConfig.dataMode);
export type { DreamdexAdapter } from "./types";
