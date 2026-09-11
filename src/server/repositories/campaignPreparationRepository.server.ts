import { getDatabase, unwrapDatabaseResult } from "../db.server";

export async function insertCampaignPreparation(values: Record<string, unknown>) {
  return unwrapDatabaseResult(
    await getDatabase().from("campaign_preparations").insert(values).select().single(),
  );
}

export async function findCampaignPreparation(id: string) {
  return unwrapDatabaseResult(
    await getDatabase().from("campaign_preparations").select("*").eq("id", id).maybeSingle(),
  );
}

export async function consumeCampaignPreparation(id: string) {
  return unwrapDatabaseResult(
    await getDatabase()
      .from("campaign_preparations")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", id)
      .is("consumed_at", null)
      .select()
      .single(),
  );
}
