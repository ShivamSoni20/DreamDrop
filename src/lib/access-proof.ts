export interface WalletAccessProof {
  wallet: string;
  resource: string;
  deadline: number;
  signature: string;
}

export function accessProofMessage(wallet: string, resource: string, deadline: number) {
  return [
    "DreamDrop private data access",
    `Wallet: ${wallet.toLowerCase()}`,
    `Resource: ${resource}`,
    `Chain ID: 50312`,
    `Deadline: ${deadline}`,
  ].join("\n");
}
