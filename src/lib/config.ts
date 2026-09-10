const envNumber = (value: string | undefined, fallback: number) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
const env = import.meta.env;
export const appConfig = {
  dataMode: env["VITE_DATA_MODE"] ?? "mock",
  chainId: envNumber(env["VITE_CHAIN_ID"], 50312),
  rpcUrl: env["VITE_RPC_URL"] ?? "https://dream-rpc.somnia.network",
  dreamdexApiUrl: env["VITE_DREAMDEX_API_URL"] ?? "https://stg.api.dreamdex.io/v0",
  relayerApiUrl: env["VITE_RELAYER_API_URL"] ?? "/api",
  campaignHeadroomMinSeconds: envNumber(env["VITE_CAMPAIGN_HEADROOM_MIN_SECONDS"], 45),
  campaignHeadroomFraction: envNumber(env["VITE_CAMPAIGN_HEADROOM_FRACTION"], 0.2),
  explorerUrl: env["VITE_EXPLORER_URL"] ?? "https://shannon-explorer.somnia.network",
} as const;
