import { getDatabase, unwrapDatabaseResult } from "../db.server";

export async function insertPosition(values: Record<string, unknown>) {
  return unwrapDatabaseResult(
    await getDatabase().from("positions").insert(values).select().single(),
  );
}

export async function findPositionsByOwner(ownerWallet: string) {
  return unwrapDatabaseResult(
    await getDatabase()
      .from("positions")
      .select("*, campaigns(*)")
      .ilike("owner_wallet", ownerWallet)
      .order("created_at", { ascending: false }),
  );
}

export async function findPositionById(id: string) {
  return unwrapDatabaseResult(
    await getDatabase().from("positions").select("*, campaigns(*)").eq("id", id).maybeSingle(),
  );
}

export async function updatePosition(id: string, values: Record<string, unknown>) {
  return unwrapDatabaseResult(
    await getDatabase()
      .from("positions")
      .update(values)
      .eq("id", id)
      .select("*, campaigns(*)")
      .single(),
  );
}

export async function findPositionByClaim(claimId: string) {
  return unwrapDatabaseResult(
    await getDatabase().from("positions").select("*").eq("claim_id", claimId).maybeSingle(),
  );
}
