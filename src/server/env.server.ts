import { z } from "zod";

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RELAYER_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  DREAMDROP_DISTRIBUTOR_ADDRESS: address,
  CLAIM_SIGNING_SECRET: z.string().min(32),
  SOMNIA_RPC_URL: z.string().url().default("https://dream-rpc.somnia.network"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing or invalid live server configuration: ${names}`);
  }
  cached = parsed.data;
  return cached;
}
