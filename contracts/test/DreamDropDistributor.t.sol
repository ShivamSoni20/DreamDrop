// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DreamDropDistributor} from "../src/DreamDropDistributor.sol";

interface Vm {
    function addr(uint256 privateKey) external returns (address);
    function chainId(uint256 newChainId) external;
    function expectRevert(bytes4 selector) external;
    function prank(address sender) external;
    function sign(uint256 privateKey, bytes32 digest) external returns (uint8 v, bytes32 r, bytes32 s);
    function warp(uint256 timestamp) external;
}

contract MockERC6909 {
    mapping(address => mapping(uint256 => uint256)) public balanceOf;
    mapping(address => mapping(address => bool)) public isOperator;
    bool public failTransfers;

    function setFailTransfers(bool fail) external {
        failTransfers = fail;
    }

    function mint(address receiver, uint256 id, uint256 amount) external {
        balanceOf[receiver][id] += amount;
    }

    function setOperator(address operator, bool approved) external {
        isOperator[msg.sender][operator] = approved;
    }

    function transfer(address receiver, uint256 id, uint256 amount) external returns (bool) {
        if (failTransfers) return false;
        _transfer(msg.sender, receiver, id, amount);
        return true;
    }

    function transferFrom(address sender, address receiver, uint256 id, uint256 amount) external returns (bool) {
        if (failTransfers) return false;
        require(msg.sender == sender || isOperator[sender][msg.sender], "NOT_AUTHORIZED");
        _transfer(sender, receiver, id, amount);
        return true;
    }

    function _transfer(address sender, address receiver, uint256 id, uint256 amount) private {
        require(balanceOf[sender][id] >= amount, "INSUFFICIENT_BALANCE");
        balanceOf[sender][id] -= amount;
        balanceOf[receiver][id] += amount;
    }
}

contract DreamDropDistributorTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 private constant RECIPIENT_KEY = 0xA11CE;
    uint256 private constant OTHER_KEY = 0xB0B;
    uint256 private constant TOKEN_ID = 11;
    uint256 private constant AMOUNT = 1_000_000;
    uint256 private constant NONCE = 7;
    bytes32 private constant SECRET = keccak256("claim secret");
    bytes32 private constant CLAIM_TYPEHASH = keccak256(
        "Claim(uint256 campaignId,uint256 claimIndex,address recipient,uint256 chainId,uint256 deadline,uint256 nonce)"
    );
    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    DreamDropDistributor private distributor;
    MockERC6909 private token;
    address private recipient;
    address private other;
    uint64 private campaignDeadline;

    function setUp() public {
        distributor = new DreamDropDistributor();
        token = new MockERC6909();
        recipient = vm.addr(RECIPIENT_KEY);
        other = vm.addr(OTHER_KEY);
        campaignDeadline = uint64(block.timestamp + 1 days);
        token.mint(address(this), TOKEN_ID, AMOUNT * 10);
        token.setOperator(address(distributor), true);
    }

    function testCreateCampaign() public {
        uint256 id =
            distributor.createCampaign(address(token), _leaf(1, 0, TOKEN_ID, AMOUNT, SECRET), campaignDeadline, 1);
        (address creator, address outcomeToken, bytes32 root, uint64 deadline, bool closed) = distributor.campaigns(id);
        _assertEq(creator, address(this));
        _assertEq(outcomeToken, address(token));
        _assertEq(root, _leaf(1, 0, TOKEN_ID, AMOUNT, SECRET));
        _assertEq(uint256(deadline), uint256(campaignDeadline));
        require(!closed, "campaign unexpectedly closed");
    }

    function testRejectsZeroOutcomeToken() public {
        vm.expectRevert(DreamDropDistributor.InvalidCampaign.selector);
        distributor.createCampaign(address(0), bytes32(uint256(1)), campaignDeadline, 1);
    }

    function testRejectsZeroMerkleRoot() public {
        vm.expectRevert(DreamDropDistributor.InvalidCampaign.selector);
        distributor.createCampaign(address(token), bytes32(0), campaignDeadline, 1);
    }

    function testRejectsExpiredCampaignDeadline() public {
        vm.expectRevert(DreamDropDistributor.InvalidCampaign.selector);
        distributor.createCampaign(address(token), bytes32(uint256(1)), uint64(block.timestamp), 1);
    }

    function testRejectsUnexpectedCampaignIdWithoutConsumingId() public {
        vm.expectRevert(DreamDropDistributor.UnexpectedCampaignId.selector);
        distributor.createCampaign(address(token), bytes32(uint256(1)), campaignDeadline, 2);
        _assertEq(distributor.nextCampaignId(), 1);
    }

    function testOnlyCreatorCanFund() public {
        uint256 id = _createSingleClaimCampaign();
        vm.prank(other);
        vm.expectRevert(DreamDropDistributor.NotCreator.selector);
        distributor.fundCampaign(id, TOKEN_ID, AMOUNT);
    }

    function testFundingTransfersInventory() public {
        uint256 id = _createSingleClaimCampaign();
        distributor.fundCampaign(id, TOKEN_ID, AMOUNT);
        _assertEq(token.balanceOf(address(distributor), TOKEN_ID), AMOUNT);
        _assertEq(token.balanceOf(address(this), TOKEN_ID), AMOUNT * 9);
        _assertEq(distributor.campaignInventory(id, TOKEN_ID), AMOUNT);
    }

    function testCampaignsSharingTokenIdKeepIndependentInventory() public {
        uint256 first = _createSingleClaimCampaign();
        uint256 second = distributor.createCampaign(
            address(token), _leaf(2, 0, TOKEN_ID, AMOUNT, keccak256("second")), campaignDeadline, 2
        );
        distributor.fundCampaign(first, TOKEN_ID, AMOUNT);
        distributor.fundCampaign(second, TOKEN_ID, AMOUNT * 2);

        _claim(first, 0, TOKEN_ID, AMOUNT, SECRET, recipient, block.timestamp + 1 hours, NONCE, RECIPIENT_KEY);
        _assertEq(distributor.campaignInventory(first, TOKEN_ID), 0);
        _assertEq(distributor.campaignInventory(second, TOKEN_ID), AMOUNT * 2);
    }

    function testClaimRejectsInsufficientCampaignInventory() public {
        uint256 id = _createSingleClaimCampaign();
        vm.expectRevert(DreamDropDistributor.InsufficientCampaignInventory.selector);
        _claim(id, 0, TOKEN_ID, AMOUNT, SECRET, recipient, block.timestamp + 1 hours, NONCE, RECIPIENT_KEY);
    }

    function testFundingRejectsFalseTokenTransfer() public {
        uint256 id = _createSingleClaimCampaign();
        token.setFailTransfers(true);
        vm.expectRevert(DreamDropDistributor.TokenTransferFailed.selector);
        distributor.fundCampaign(id, TOKEN_ID, AMOUNT);
        _assertEq(distributor.campaignInventory(id, TOKEN_ID), 0);
    }

    function testValidMerkleClaimTransfersExactTokenAndAmount() public {
        uint256 id = _fundSingleClaimCampaign();
        _claim(id, 0, TOKEN_ID, AMOUNT, SECRET, recipient, block.timestamp + 1 hours, NONCE, RECIPIENT_KEY);
        _assertEq(token.balanceOf(recipient, TOKEN_ID), AMOUNT);
        _assertEq(token.balanceOf(address(distributor), TOKEN_ID), 0);
        _assertEq(distributor.campaignInventory(id, TOKEN_ID), 0);
        require(distributor.claimed(id, 0), "claim index not consumed");
    }

    function testInvalidProofRejected() public {
        uint256 id = _fundSingleClaimCampaign();
        vm.expectRevert(DreamDropDistributor.InvalidProof.selector);
        _claim(id, 0, TOKEN_ID, AMOUNT, keccak256("wrong"), recipient, block.timestamp + 1 hours, NONCE, RECIPIENT_KEY);
    }

    function testDuplicateClaimRejected() public {
        uint256 id = _fundSingleClaimCampaign();
        uint256 deadline = block.timestamp + 1 hours;
        _claim(id, 0, TOKEN_ID, AMOUNT, SECRET, recipient, deadline, NONCE, RECIPIENT_KEY);
        vm.expectRevert(DreamDropDistributor.AlreadyClaimed.selector);
        _claim(id, 0, TOKEN_ID, AMOUNT, SECRET, recipient, deadline, NONCE + 1, RECIPIENT_KEY);
    }

    function testExpiredRecipientAuthorizationRejected() public {
        uint256 id = _fundSingleClaimCampaign();
        uint256 deadline = block.timestamp + 10;
        bytes memory signature =
            _signature(id, 0, recipient, deadline, NONCE, RECIPIENT_KEY, block.chainid, address(distributor));
        vm.warp(deadline + 1);
        vm.expectRevert(DreamDropDistributor.AuthorizationExpired.selector);
        distributor.claim(id, 0, TOKEN_ID, AMOUNT, SECRET, new bytes32[](0), recipient, deadline, NONCE, signature);
    }

    function testWrongRecipientSignatureRejected() public {
        uint256 id = _fundSingleClaimCampaign();
        vm.expectRevert(DreamDropDistributor.InvalidAuthorization.selector);
        _claim(id, 0, TOKEN_ID, AMOUNT, SECRET, recipient, block.timestamp + 1 hours, NONCE, OTHER_KEY);
    }

    function testNonceReplayRejectedAcrossClaims() public {
        uint256 first = _fundSingleClaimCampaign();
        _claim(first, 0, TOKEN_ID, AMOUNT, SECRET, recipient, block.timestamp + 1 hours, NONCE, RECIPIENT_KEY);

        bytes32 secondSecret = keccak256("second secret");
        uint256 second = distributor.createCampaign(
            address(token), _leaf(2, 1, TOKEN_ID, AMOUNT, secondSecret), campaignDeadline, 2
        );
        distributor.fundCampaign(second, TOKEN_ID, AMOUNT);
        vm.expectRevert(DreamDropDistributor.InvalidAuthorization.selector);
        _claim(second, 1, TOKEN_ID, AMOUNT, secondSecret, recipient, block.timestamp + 1 hours, NONCE, RECIPIENT_KEY);
    }

    function testCreatorCanCloseCampaign() public {
        uint256 id = _createSingleClaimCampaign();
        distributor.closeCampaign(id);
        (,,,, bool closed) = distributor.campaigns(id);
        require(closed, "campaign not closed");
    }

    function testRepeatedCloseRejected() public {
        uint256 id = _createSingleClaimCampaign();
        distributor.closeCampaign(id);
        vm.expectRevert(DreamDropDistributor.CampaignAlreadyClosed.selector);
        distributor.closeCampaign(id);
    }

    function testClaimAfterCloseRejected() public {
        uint256 id = _fundSingleClaimCampaign();
        distributor.closeCampaign(id);
        vm.expectRevert(DreamDropDistributor.CampaignAlreadyClosed.selector);
        _claim(id, 0, TOKEN_ID, AMOUNT, SECRET, recipient, block.timestamp + 1 hours, NONCE, RECIPIENT_KEY);
    }

    function testClaimRejectsFalseTokenTransferWithoutConsumingState() public {
        uint256 id = _fundSingleClaimCampaign();
        token.setFailTransfers(true);
        vm.expectRevert(DreamDropDistributor.TokenTransferFailed.selector);
        _claim(id, 0, TOKEN_ID, AMOUNT, SECRET, recipient, block.timestamp + 1 hours, NONCE, RECIPIENT_KEY);
        require(!distributor.claimed(id, 0), "failed transfer consumed claim");
        require(!distributor.usedNonces(recipient, NONCE), "failed transfer consumed nonce");
        _assertEq(distributor.campaignInventory(id, TOKEN_ID), AMOUNT);
    }

    function testOnlyCreatorCanWithdrawRemaining() public {
        uint256 id = _fundSingleClaimCampaign();
        distributor.closeCampaign(id);
        vm.prank(other);
        vm.expectRevert(DreamDropDistributor.NotCreator.selector);
        distributor.withdrawRemaining(id, TOKEN_ID, other);
    }

    function testCannotWithdrawWhileCampaignActive() public {
        uint256 id = _fundSingleClaimCampaign();
        vm.expectRevert(DreamDropDistributor.InventoryStillActive.selector);
        distributor.withdrawRemaining(id, TOKEN_ID, address(this));
    }

    function testCreatorWithdrawsRemainingAfterClose() public {
        uint256 id = _fundSingleClaimCampaign();
        uint256 beforeBalance = token.balanceOf(address(this), TOKEN_ID);
        distributor.closeCampaign(id);
        uint256 withdrawn = distributor.withdrawRemaining(id, TOKEN_ID, other);
        _assertEq(withdrawn, AMOUNT);
        _assertEq(token.balanceOf(other, TOKEN_ID), AMOUNT);
        _assertEq(token.balanceOf(address(this), TOKEN_ID), beforeBalance);
        _assertEq(distributor.campaignInventory(id, TOKEN_ID), 0);
    }

    function testCreatorWithdrawsRemainingAfterExpiry() public {
        uint256 id = _fundSingleClaimCampaign();
        vm.warp(uint256(campaignDeadline) + 1);
        distributor.withdrawRemaining(id, TOKEN_ID, address(this));
        _assertEq(distributor.campaignInventory(id, TOKEN_ID), 0);
        _assertEq(token.balanceOf(address(this), TOKEN_ID), AMOUNT * 10);
    }

    function testCannotWithdrawInventoryTwice() public {
        uint256 id = _fundSingleClaimCampaign();
        distributor.closeCampaign(id);
        distributor.withdrawRemaining(id, TOKEN_ID, address(this));
        vm.expectRevert(DreamDropDistributor.InsufficientCampaignInventory.selector);
        distributor.withdrawRemaining(id, TOKEN_ID, address(this));
    }

    function testWithdrawalCannotConsumeAnotherCampaignInventory() public {
        uint256 first = _fundSingleClaimCampaign();
        uint256 second = distributor.createCampaign(
            address(token), _leaf(2, 0, TOKEN_ID, AMOUNT, keccak256("second")), campaignDeadline, 2
        );
        distributor.fundCampaign(second, TOKEN_ID, AMOUNT);
        distributor.closeCampaign(first);
        distributor.withdrawRemaining(first, TOKEN_ID, address(this));
        _assertEq(distributor.campaignInventory(second, TOKEN_ID), AMOUNT);
        _assertEq(token.balanceOf(address(distributor), TOKEN_ID), AMOUNT);
    }

    function testDomainSeparatorMatchesNameVersionChainAndContract() public view {
        bytes32 expected = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH, keccak256("DreamDropDistributor"), keccak256("1"), block.chainid, address(distributor)
            )
        );
        _assertEq(distributor.DOMAIN_SEPARATOR(), expected);
        _assertEq(distributor.CLAIM_TYPEHASH(), CLAIM_TYPEHASH);
    }

    function testWrongVerifyingContractSignatureRejected() public {
        uint256 id = _fundSingleClaimCampaign();
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory signature =
            _signature(id, 0, recipient, deadline, NONCE, RECIPIENT_KEY, block.chainid, address(0xdead));
        vm.expectRevert(DreamDropDistributor.InvalidAuthorization.selector);
        distributor.claim(id, 0, TOKEN_ID, AMOUNT, SECRET, new bytes32[](0), recipient, deadline, NONCE, signature);
    }

    function testWrongChainSignatureRejected() public {
        uint256 id = _fundSingleClaimCampaign();
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory signature =
            _signature(id, 0, recipient, deadline, NONCE, RECIPIENT_KEY, block.chainid + 1, address(distributor));
        vm.expectRevert(DreamDropDistributor.InvalidAuthorization.selector);
        distributor.claim(id, 0, TOKEN_ID, AMOUNT, SECRET, new bytes32[](0), recipient, deadline, NONCE, signature);
    }

    function testNormalizedVIsAccepted() public {
        uint256 id = _fundSingleClaimCampaign();
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 digest = _digest(id, 0, recipient, deadline, NONCE, block.chainid, address(distributor));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(RECIPIENT_KEY, digest);
        distributor.claim(
            id,
            0,
            TOKEN_ID,
            AMOUNT,
            SECRET,
            new bytes32[](0),
            recipient,
            deadline,
            NONCE,
            abi.encodePacked(r, s, v - 27)
        );
        _assertEq(token.balanceOf(recipient, TOKEN_ID), AMOUNT);
    }

    function testHighSRejected() public {
        uint256 id = _fundSingleClaimCampaign();
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 digest = _digest(id, 0, recipient, deadline, NONCE, block.chainid, address(distributor));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(RECIPIENT_KEY, digest);
        bytes32 highS = bytes32(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - uint256(s));
        uint8 flippedV = v == 27 ? 28 : 27;
        vm.expectRevert(DreamDropDistributor.InvalidAuthorization.selector);
        distributor.claim(
            id,
            0,
            TOKEN_ID,
            AMOUNT,
            SECRET,
            new bytes32[](0),
            recipient,
            deadline,
            NONCE,
            abi.encodePacked(r, highS, flippedV)
        );
    }

    function _createSingleClaimCampaign() private returns (uint256) {
        return distributor.createCampaign(address(token), _leaf(1, 0, TOKEN_ID, AMOUNT, SECRET), campaignDeadline, 1);
    }

    function _fundSingleClaimCampaign() private returns (uint256 id) {
        id = _createSingleClaimCampaign();
        distributor.fundCampaign(id, TOKEN_ID, AMOUNT);
    }

    function _claim(
        uint256 campaignId,
        uint256 claimIndex,
        uint256 tokenId,
        uint256 amount,
        bytes32 secret,
        address claimRecipient,
        uint256 deadline,
        uint256 nonce,
        uint256 signerKey
    ) private {
        bytes memory signature = _signature(
            campaignId, claimIndex, claimRecipient, deadline, nonce, signerKey, block.chainid, address(distributor)
        );
        distributor.claim(
            campaignId,
            claimIndex,
            tokenId,
            amount,
            secret,
            new bytes32[](0),
            claimRecipient,
            deadline,
            nonce,
            signature
        );
    }

    function _signature(
        uint256 campaignId,
        uint256 claimIndex,
        address claimRecipient,
        uint256 deadline,
        uint256 nonce,
        uint256 signerKey,
        uint256 chainId,
        address verifyingContract
    ) private returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            signerKey, _digest(campaignId, claimIndex, claimRecipient, deadline, nonce, chainId, verifyingContract)
        );
        return abi.encodePacked(r, s, v);
    }

    function _digest(
        uint256 campaignId,
        uint256 claimIndex,
        address claimRecipient,
        uint256 deadline,
        uint256 nonce,
        uint256 chainId,
        address verifyingContract
    ) private pure returns (bytes32) {
        bytes32 domain = keccak256(
            abi.encode(DOMAIN_TYPEHASH, keccak256("DreamDropDistributor"), keccak256("1"), chainId, verifyingContract)
        );
        bytes32 structHash =
            keccak256(abi.encode(CLAIM_TYPEHASH, campaignId, claimIndex, claimRecipient, chainId, deadline, nonce));
        return keccak256(abi.encodePacked("\x19\x01", domain, structHash));
    }

    function _leaf(uint256 campaignId, uint256 claimIndex, uint256 tokenId, uint256 amount, bytes32 secret)
        private
        pure
        returns (bytes32)
    {
        return keccak256(
            bytes.concat(keccak256(abi.encode(campaignId, claimIndex, tokenId, amount, keccak256(abi.encode(secret)))))
        );
    }

    function _assertEq(uint256 actual, uint256 expected) private pure {
        require(actual == expected, "uint mismatch");
    }

    function _assertEq(address actual, address expected) private pure {
        require(actual == expected, "address mismatch");
    }

    function _assertEq(bytes32 actual, bytes32 expected) private pure {
        require(actual == expected, "bytes32 mismatch");
    }
}
