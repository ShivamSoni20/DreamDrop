import type { ClaimChallenge } from "@/lib/types";
import { appConfig } from "@/lib/config";
import { serializeClaimTypedData } from "@/lib/claim-authorization";
export type WalletConnectionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "WRONG_NETWORK";
export interface ConnectedWallet {
  address: string;
  chainId: number;
}
let connected: ConnectedWallet | null = null;
export async function connectWallet() {
  await new Promise((r) => setTimeout(r, 400));
  connected = { address: "0x71c4b9f0a2c8d31e6b47a90f2d5c8e1039A2", chainId: 50312 };
  return connected;
}
export async function disconnectWallet() {
  connected = null;
}
export async function getConnectedWallet() {
  return connected;
}
export async function getCurrentChain() {
  return connected?.chainId ?? null;
}
export async function switchToSomnia() {
  if (connected) connected = { ...connected, chainId: 50312 };
  return connected;
}
export async function signClaimAuthorization(payload: ClaimChallenge) {
  if (appConfig.dataMode === "mock")
    return `0xmocksignature${payload.id.replace(/[^a-z0-9]/gi, "")}`;
  const provider = window.ethereum;
  if (!provider) throw new Error("No injected wallet found.");
  const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
  const account = accounts[0];
  if (!account || account.toLowerCase() !== payload.walletAddress.toLowerCase())
    throw new Error("Connect the wallet this claim was prepared for.");
  return provider.request({
    method: "eth_signTypedData_v4",
    params: [account, serializeClaimTypedData(payload.typedData)],
  }) as Promise<string>;
}
