import { getAddress, recoverMessageAddress, type Address, type Hex } from "viem";
import { accessProofMessage, type WalletAccessProof } from "@/lib/access-proof";

export async function verifyAccessProof(
  proof: WalletAccessProof,
  resource: string,
): Promise<Address> {
  const now = Math.floor(Date.now() / 1000);
  if (proof.resource !== resource || proof.deadline < now || proof.deadline > now + 300)
    throw new Error("Wallet access proof is expired or invalid.");
  const wallet = getAddress(proof.wallet);
  const recovered = await recoverMessageAddress({
    message: accessProofMessage(wallet, resource, proof.deadline),
    signature: proof.signature as Hex,
  });
  if (recovered !== wallet) throw new Error("Wallet access proof signer does not match.");
  return wallet;
}
