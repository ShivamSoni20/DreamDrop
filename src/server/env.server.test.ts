import { describe, expect, it } from "vitest";
import { validateServerEnv } from "./env.server";

const valid = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "server-only-key",
  RELAYER_PRIVATE_KEY: `0x${"11".repeat(32)}`,
  DREAMDROP_DISTRIBUTOR_ADDRESS: `0x${"22".repeat(20)}`,
  CLAIM_SIGNING_SECRET: "a-long-random-server-signing-secret",
};

describe("live server environment", () => {
  it("accepts valid server-only configuration", () => {
    expect(validateServerEnv(valid).DREAMDROP_DISTRIBUTOR_ADDRESS).toBe(
      valid.DREAMDROP_DISTRIBUTOR_ADDRESS,
    );
  });

  it("fails clearly without Supabase or Distributor configuration", () => {
    expect(() => validateServerEnv({ ...valid, SUPABASE_URL: "" })).toThrow("SUPABASE_URL");
    expect(() => validateServerEnv({ ...valid, DREAMDROP_DISTRIBUTOR_ADDRESS: "" })).toThrow(
      "DREAMDROP_DISTRIBUTOR_ADDRESS",
    );
  });
});
