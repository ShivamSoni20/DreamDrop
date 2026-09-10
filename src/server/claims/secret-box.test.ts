import { describe, expect, it } from "vitest";
import { decryptClaimSecret, encryptClaimSecret } from "./secret-box.server";

describe("claim secret encryption", () => {
  it("round trips without storing plaintext", () => {
    const secret = `0x${"ab".repeat(32)}`;
    const encrypted = encryptClaimSecret(secret, "a sufficiently long test signing secret");
    expect(encrypted).not.toContain(secret);
    expect(decryptClaimSecret(encrypted, "a sufficiently long test signing secret")).toBe(secret);
  });
});
