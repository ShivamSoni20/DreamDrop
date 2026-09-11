import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { accessProofMessage } from "@/lib/access-proof";
import { verifyAccessProof } from "./access-proof.server";

const account = privateKeyToAccount(`0x${"11".repeat(32)}`);

async function proof(resource = "owner:positions", deadline = Math.floor(Date.now() / 1000) + 60) {
  return {
    wallet: account.address,
    resource,
    deadline,
    signature: await account.signMessage({
      message: accessProofMessage(account.address, resource, deadline),
    }),
  };
}

describe("wallet access proofs", () => {
  it("accepts a short-lived proof bound to wallet and resource", async () => {
    await expect(verifyAccessProof(await proof(), "owner:positions")).resolves.toBe(
      account.address,
    );
  });

  it("rejects resource substitution and expired proofs", async () => {
    await expect(verifyAccessProof(await proof(), "creator:campaigns")).rejects.toThrow(
      "expired or invalid",
    );
    await expect(
      verifyAccessProof(
        await proof("owner:positions", Math.floor(Date.now() / 1000) - 1),
        "owner:positions",
      ),
    ).rejects.toThrow("expired or invalid");
  });
});
