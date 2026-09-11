import { getDatabase, unwrapDatabaseResult } from "../db.server";

export async function insertClaims(values: Array<Record<string, unknown>>) {
  return unwrapDatabaseResult(await getDatabase().from("claims").insert(values).select());
}

export async function findClaimByCodeHash(claimCodeHash: string) {
  return unwrapDatabaseResult(
    await getDatabase()
      .from("claims")
      .select("*, campaigns(*)")
      .eq("claim_code_hash", claimCodeHash)
      .maybeSingle(),
  );
}

export async function findClaimById(id: string) {
  return unwrapDatabaseResult(
    await getDatabase().from("claims").select("*, campaigns(*)").eq("id", id).maybeSingle(),
  );
}

export async function findClaimsByCampaign(campaignId: string) {
  return unwrapDatabaseResult(
    await getDatabase().from("claims").select("id").eq("campaign_id", campaignId),
  );
}

export async function reserveClaim(claimId: string, requestId: string, reservedUntil: string) {
  return unwrapDatabaseResult(
    await getDatabase().rpc("reserve_dreamdrop_claim", {
      p_claim_id: claimId,
      p_request_id: requestId,
      p_reserved_until: reservedUntil,
    }),
  ) as boolean;
}

export async function completeClaim(id: string, values: Record<string, unknown>) {
  return unwrapDatabaseResult(
    await getDatabase()
      .from("claims")
      .update({ ...values, claimed: true })
      .eq("id", id)
      .select()
      .single(),
  );
}
