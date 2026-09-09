import type { ClaimChallenge } from "@/lib/types";
export type WalletConnectionStatus = "DISCONNECTED"|"CONNECTING"|"CONNECTED"|"WRONG_NETWORK";
export interface ConnectedWallet { address:string; chainId:number; }
let connected:ConnectedWallet|null=null;
export async function connectWallet(){await new Promise(r=>setTimeout(r,400));connected={address:"0x71c4b9f0a2c8d31e6b47a90f2d5c8e1039A2",chainId:50312};return connected;}
export async function disconnectWallet(){connected=null;}
export async function getConnectedWallet(){return connected;}
export async function getCurrentChain(){return connected?.chainId??null;}
export async function switchToSomnia(){if(connected)connected={...connected,chainId:50312};return connected;}
export async function signClaimAuthorization(payload:ClaimChallenge){return `0xmocksignature${payload.id.replace(/[^a-z0-9]/gi,"")}`;}
