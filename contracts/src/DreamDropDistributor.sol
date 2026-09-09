// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC6909 {
    function transfer(address receiver, uint256 id, uint256 amount) external returns (bool);
    function transferFrom(address sender, address receiver, uint256 id, uint256 amount) external returns (bool);
}

/// @notice Custodies DreamDEX outcome tokens and releases one committed drop per signed claim.
contract DreamDropDistributor {
    struct Campaign {
        address creator;
        address outcomeToken;
        bytes32 merkleRoot;
        uint64 claimDeadline;
        bool closed;
    }

    bytes32 private constant CLAIM_TYPEHASH = keccak256(
        "Claim(uint256 campaignId,uint256 claimIndex,address recipient,uint256 chainId,uint256 deadline,uint256 nonce)"
    );
    bytes32 private immutable DOMAIN_SEPARATOR;

    uint256 public nextCampaignId = 1;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(uint256 => bool)) public claimed;
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    error AlreadyClaimed();
    error AuthorizationExpired();
    error CampaignClosed();
    error CampaignExpired();
    error InvalidAuthorization();
    error InvalidCampaign();
    error InvalidProof();
    error NotCreator();
    error TokenTransferFailed();

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, address indexed outcomeToken, bytes32 merkleRoot, uint64 claimDeadline);
    event CampaignFunded(uint256 indexed campaignId, uint256 indexed tokenId, uint256 amount);
    event DropClaimed(uint256 indexed campaignId, uint256 indexed claimIndex, address indexed recipient, uint256 tokenId, uint256 amount);
    event CampaignClosed(uint256 indexed campaignId);

    constructor() {
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("DreamDropDistributor"),
            keccak256("1"),
            block.chainid,
            address(this)
        ));
    }

    function createCampaign(address outcomeToken, bytes32 merkleRoot, uint64 claimDeadline) external returns (uint256 campaignId) {
        if (outcomeToken == address(0) || merkleRoot == bytes32(0) || claimDeadline <= block.timestamp) revert InvalidCampaign();
        campaignId = nextCampaignId++;
        campaigns[campaignId] = Campaign(msg.sender, outcomeToken, merkleRoot, claimDeadline, false);
        emit CampaignCreated(campaignId, msg.sender, outcomeToken, merkleRoot, claimDeadline);
    }

    function fundCampaign(uint256 campaignId, uint256 tokenId, uint256 amount) external {
        Campaign memory campaign = campaigns[campaignId];
        if (campaign.creator == address(0)) revert InvalidCampaign();
        if (campaign.creator != msg.sender) revert NotCreator();
        if (campaign.closed) revert CampaignClosed();
        if (!IERC6909(campaign.outcomeToken).transferFrom(msg.sender, address(this), tokenId, amount)) revert TokenTransferFailed();
        emit CampaignFunded(campaignId, tokenId, amount);
    }

    function claim(
        uint256 campaignId,
        uint256 claimIndex,
        uint256 tokenId,
        uint256 amount,
        bytes32 secret,
        bytes32[] calldata proof,
        address recipient,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature
    ) external {
        Campaign memory campaign = campaigns[campaignId];
        if (campaign.creator == address(0)) revert InvalidCampaign();
        if (campaign.closed) revert CampaignClosed();
        if (block.timestamp > campaign.claimDeadline) revert CampaignExpired();
        if (block.timestamp > deadline) revert AuthorizationExpired();
        if (claimed[campaignId][claimIndex]) revert AlreadyClaimed();
        if (usedNonces[recipient][nonce]) revert InvalidAuthorization();

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(campaignId, claimIndex, tokenId, amount, keccak256(abi.encode(secret))))));
        if (!_verify(proof, campaign.merkleRoot, leaf)) revert InvalidProof();

        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, campaignId, claimIndex, recipient, block.chainid, deadline, nonce));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        if (_recover(digest, signature) != recipient) revert InvalidAuthorization();

        claimed[campaignId][claimIndex] = true;
        usedNonces[recipient][nonce] = true;
        if (!IERC6909(campaign.outcomeToken).transfer(recipient, tokenId, amount)) revert TokenTransferFailed();
        emit DropClaimed(campaignId, claimIndex, recipient, tokenId, amount);
    }

    function closeCampaign(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.creator == address(0)) revert InvalidCampaign();
        if (campaign.creator != msg.sender) revert NotCreator();
        campaign.closed = true;
        emit CampaignClosed(campaignId);
    }

    function _verify(bytes32[] calldata proof, bytes32 root, bytes32 leaf) private pure returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i; i < proof.length; ++i) {
            bytes32 node = proof[i];
            computed = computed < node
                ? keccak256(abi.encodePacked(computed, node))
                : keccak256(abi.encodePacked(node, computed));
        }
        return computed == root;
    }

    function _recover(bytes32 digest, bytes calldata signature) private pure returns (address signer) {
        if (signature.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (uint256(s) > 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0) return address(0);
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        signer = ecrecover(digest, v, r, s);
    }
}
