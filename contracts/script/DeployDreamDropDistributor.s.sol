// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DreamDropDistributor} from "../src/DreamDropDistributor.sol";

interface Vm {
    function startBroadcast() external;
    function stopBroadcast() external;
}

contract DeployDreamDropDistributor {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (DreamDropDistributor distributor) {
        vm.startBroadcast();
        distributor = new DreamDropDistributor();
        vm.stopBroadcast();
    }
}
