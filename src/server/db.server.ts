import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env.server";

let client: SupabaseClient | undefined;

export function getDatabase(): SupabaseClient {
  if (client) return client;
  const env = getServerEnv();
  client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

export function unwrapDatabaseResult<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(`Database operation failed: ${result.error.message}`);
  return result.data;
}
