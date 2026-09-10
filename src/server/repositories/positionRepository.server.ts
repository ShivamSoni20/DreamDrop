import { getDatabase, unwrapDatabaseResult } from "../db.server";

export async function insertPosition(values: Record<string, unknown>) {
  return unwrapDatabaseResult(
    await getDatabase().from("positions").insert(values).select().single(),
  );
}

export async function findPositionsByOwner(ownerWallet: string) {
  return unwrapDatabaseResult(
    await getDatabase().from("positions").select("*").ilike("owner_wallet", ownerWallet),
  );
}

export async function findPositionByClaim(claimId: string) {
  return unwrapDatabaseResult(
    await getDatabase().from("positions").select("*").eq("claim_id", claimId).maybeSingle(),
  );
}
