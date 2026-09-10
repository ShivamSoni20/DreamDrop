import { getDatabase, unwrapDatabaseResult } from "../db.server";

export async function insertCampaign(values: Record<string, unknown>) {
  return unwrapDatabaseResult(
    await getDatabase().from("campaigns").insert(values).select().single(),
  );
}

export async function findCampaignById(id: string) {
  return unwrapDatabaseResult(
    await getDatabase().from("campaigns").select("*").eq("id", id).maybeSingle(),
  );
}

export async function updateCampaign(id: string, values: Record<string, unknown>) {
  return unwrapDatabaseResult(
    await getDatabase().from("campaigns").update(values).eq("id", id).select().single(),
  );
}
