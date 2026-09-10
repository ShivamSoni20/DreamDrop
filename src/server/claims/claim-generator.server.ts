import { createHash, randomBytes, randomInt } from "node:crypto";
import { encodeAbiParameters, keccak256, type Hex } from "viem";

export interface GeneratedClaim {
  claimIndex: bigint;
  tokenId: bigint;
  side: "UP" | "DOWN";
  amountRaw: bigint;
  secret: Hex;
  secretHash: Hex;
  leafHash: Hex;
  claimCode: string;
  claimCodeHash: string;
  merkleProof: Hex[];
}

export function hashClaimCode(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

export function buildClaimLeaf(input: {
  campaignId: bigint;
  claimIndex: bigint;
  tokenId: bigint;
  amountRaw: bigint;
  secret: Hex;
}): Hex {
  const secretHash = keccak256(encodeAbiParameters([{ type: "bytes32" }], [input.secret]));
  const inner = keccak256(
    encodeAbiParameters(
      [
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "bytes32" },
      ],
      [input.campaignId, input.claimIndex, input.tokenId, input.amountRaw, secretHash],
    ),
  );
  return keccak256(inner);
}

function hashPair(left: Hex, right: Hex): Hex {
  return BigInt(left) < BigInt(right)
    ? keccak256(`${left}${right.slice(2)}` as Hex)
    : keccak256(`${right}${left.slice(2)}` as Hex);
}

function buildMerkle(leaves: Hex[]) {
  if (leaves.length === 0) throw new Error("At least one claim is required.");
  const levels: Hex[][] = [leaves];
  while (levels.at(-1)!.length > 1) {
    const current = levels.at(-1)!;
    const next: Hex[] = [];
    for (let index = 0; index < current.length; index += 2) {
      const left = current[index]!;
      const right = current[index + 1];
      next.push(right ? hashPair(left, right) : left);
    }
    levels.push(next);
  }
  return { root: levels.at(-1)![0]!, levels };
}

export function verifyMerkleProof(leaf: Hex, proof: Hex[], root: Hex): boolean {
  return proof.reduce(hashPair, leaf) === root;
}

function proofFor(index: number, levels: Hex[][]): Hex[] {
  const proof: Hex[] = [];
  let cursor = index;
  for (const level of levels.slice(0, -1)) {
    const sibling = cursor % 2 === 0 ? cursor + 1 : cursor - 1;
    if (level[sibling]) proof.push(level[sibling]!);
    cursor = Math.floor(cursor / 2);
  }
  return proof;
}

function secureShuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [items[index], items[swap]] = [items[swap]!, items[index]!];
  }
  return items;
}

export function generateCampaignClaims(input: {
  campaignId: bigint;
  yesTokenId: bigint;
  noTokenId: bigint;
  amountRaw: bigint;
  completeSets: number;
}) {
  if (!Number.isSafeInteger(input.completeSets) || input.completeSets <= 0)
    throw new Error("completeSets must be a positive safe integer.");
  if (input.amountRaw <= 0n) throw new Error("amountRaw must be positive.");

  const sides = secureShuffle([
    ...Array.from({ length: input.completeSets }, () => "UP" as const),
    ...Array.from({ length: input.completeSets }, () => "DOWN" as const),
  ]);
  const claims = sides.map((side, index) => {
    const secret = `0x${randomBytes(32).toString("hex")}` as Hex;
    const claimCode = randomBytes(32).toString("base64url");
    const claimIndex = BigInt(index);
    const tokenId = side === "UP" ? input.yesTokenId : input.noTokenId;
    return {
      claimIndex,
      tokenId,
      side,
      amountRaw: input.amountRaw,
      secret,
      secretHash: keccak256(encodeAbiParameters([{ type: "bytes32" }], [secret])),
      leafHash: buildClaimLeaf({
        campaignId: input.campaignId,
        claimIndex,
        tokenId,
        amountRaw: input.amountRaw,
        secret,
      }),
      claimCode,
      claimCodeHash: hashClaimCode(claimCode),
      merkleProof: [] as Hex[],
    } satisfies GeneratedClaim;
  });
  const tree = buildMerkle(claims.map((claim) => claim.leafHash));
  claims.forEach((claim, index) => {
    claim.merkleProof = proofFor(index, tree.levels);
  });
  return { merkleRoot: tree.root, claims };
}
