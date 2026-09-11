export const dreamDropDistributorAbi = [
  {
    type: "function",
    name: "nextCampaignId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "DOMAIN_SEPARATOR",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "CLAIM_TYPEHASH",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "campaignInventory",
    stateMutability: "view",
    inputs: [{ type: "uint256" }, { type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "campaigns",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "outcomeToken", type: "address" },
      { name: "merkleRoot", type: "bytes32" },
      { name: "claimDeadline", type: "uint64" },
      { name: "closed", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "createCampaign",
    stateMutability: "nonpayable",
    inputs: [
      { name: "outcomeToken", type: "address" },
      { name: "merkleRoot", type: "bytes32" },
      { name: "claimDeadline", type: "uint64" },
      { name: "expectedCampaignId", type: "uint256" },
    ],
    outputs: [{ name: "campaignId", type: "uint256" }],
  },
  {
    type: "function",
    name: "fundCampaign",
    stateMutability: "nonpayable",
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "claimIndex", type: "uint256" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "secret", type: "bytes32" },
      { name: "proof", type: "bytes32[]" },
      { name: "recipient", type: "address" },
      { name: "deadline", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "CampaignCreated",
    inputs: [
      { indexed: true, name: "campaignId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: true, name: "outcomeToken", type: "address" },
      { indexed: false, name: "merkleRoot", type: "bytes32" },
      { indexed: false, name: "claimDeadline", type: "uint64" },
    ],
  },
  {
    type: "event",
    name: "CampaignFunded",
    inputs: [
      { indexed: true, name: "campaignId", type: "uint256" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "DropClaimed",
    inputs: [
      { indexed: true, name: "campaignId", type: "uint256" },
      { indexed: true, name: "claimIndex", type: "uint256" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "tokenId", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
] as const;

export const erc6909Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "amount", type: "uint256" }],
  },
  {
    type: "function",
    name: "isOperator",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "approved", type: "bool" }],
  },
  {
    type: "function",
    name: "setOperator",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;
