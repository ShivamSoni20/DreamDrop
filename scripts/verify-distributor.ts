import "dotenv/config";
import { createPublicClient, hashDomain, http, keccak256, stringToBytes, type Address } from "viem";
import { somniaTestnet } from "viem/chains";
import { dreamDropDistributorAbi } from "../src/lib/distributor-abi";

const address = process.env["DREAMDROP_DISTRIBUTOR_ADDRESS"] as Address | undefined;
const rpcUrl = process.env["SOMNIA_RPC_URL"] ?? "https://dream-rpc.somnia.network";
if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address))
  throw new Error("DREAMDROP_DISTRIBUTOR_ADDRESS is required.");

const client = createPublicClient({ chain: somniaTestnet, transport: http(rpcUrl) });
const [chainId, bytecode, domainSeparator, claimTypehash] = await Promise.all([
  client.getChainId(),
  client.getCode({ address }),
  client.readContract({ address, abi: dreamDropDistributorAbi, functionName: "DOMAIN_SEPARATOR" }),
  client.readContract({ address, abi: dreamDropDistributorAbi, functionName: "CLAIM_TYPEHASH" }),
]);
if (chainId !== 50312) throw new Error(`Wrong chain: expected 50312, received ${chainId}.`);
if (!bytecode || bytecode === "0x") throw new Error(`No deployed bytecode at ${address}.`);
const expectedDomain = hashDomain({
  domain: { name: "DreamDropDistributor", version: "1", chainId, verifyingContract: address },
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
  },
});
const expectedTypehash = keccak256(
  stringToBytes(
    "Claim(uint256 campaignId,uint256 claimIndex,address recipient,uint256 chainId,uint256 deadline,uint256 nonce)",
  ),
);
if (domainSeparator !== expectedDomain)
  throw new Error("Deployed DOMAIN_SEPARATOR does not match TypeScript.");
if (claimTypehash !== expectedTypehash)
  throw new Error("Deployed CLAIM_TYPEHASH does not match TypeScript.");
console.log({
  chainId,
  distributor: address,
  bytecodeBytes: (bytecode.length - 2) / 2,
  domainSeparator,
  claimTypehash,
});
