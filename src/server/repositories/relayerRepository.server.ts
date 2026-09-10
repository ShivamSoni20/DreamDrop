import { getDatabase, unwrapDatabaseResult } from "../db.server";

export async function insertRelayerRequest(values: Record<string, unknown>) {
  return unwrapDatabaseResult(
    await getDatabase().from("relayer_requests").insert(values).select().single(),
  );
}

export async function findRelayerRequest(id: string) {
  return unwrapDatabaseResult(
    await getDatabase().from("relayer_requests").select("*").eq("id", id).maybeSingle(),
  );
}

export async function updateRelayerRequest(id: string, values: Record<string, unknown>) {
  return unwrapDatabaseResult(
    await getDatabase().from("relayer_requests").update(values).eq("id", id).select().single(),
  );
}
