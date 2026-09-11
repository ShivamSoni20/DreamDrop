import { z } from "zod";

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RELAYER_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  DREAMDROP_DISTRIBUTOR_ADDRESS: address,
  CLAIM_SIGNING_SECRET: z.string().min(32),
  SOMNIA_RPC_URL: z.string().url().default("https://dream-rpc.somnia.network"),
  DREAMDEX_INDEXER_URL: z.string().url().default("https://dev.smk.somnia.host/v1/graphql"),
  SOMNIA_WS_RPC_URL: z.string().url().default("wss://api.infra.testnet.somnia.network/ws"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function validateServerEnv(input: NodeJS.ProcessEnv): ServerEnv {
  const parsed = serverEnvSchema.safeParse(input);
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing or invalid live server configuration: ${names}`);
  }
  return parsed.data;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  cached = validateServerEnv(process.env);
  return cached;
}
