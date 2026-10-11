// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract OriginalityAgreement is EIP712 {
    struct Agreement {
        bytes32 agreementHash;
        address signer;
        uint256 signedAt;
        bool exists;
    }

    mapping(address => Agreement) public agreements;

    bytes32 private constant AGREEMENT_TYPEHASH =
        keccak256("SignAgreement(bytes32 agreementHash,address signer,uint256 nonce)");

    event AgreementSigned(address indexed signer, bytes32 agreementHash, uint256 signedAt);

    constructor() EIP712("OriginalityAgreement", "1.0.0") {}

    function signAgreement(
        bytes32 agreementHash,
        bytes memory signature
    ) external {
        require(!agreements[msg.sender].exists, "Already signed");

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(AGREEMENT_TYPEHASH, agreementHash, msg.sender, uint256(0)))
        );
        address recovered = ECDSA.recover(digest, signature);
        require(recovered == msg.sender, "Invalid signature");

        agreements[msg.sender] = Agreement({
            agreementHash: agreementHash,
            signer: msg.sender,
            signedAt: block.timestamp,
            exists: true
        });

        emit AgreementSigned(msg.sender, agreementHash, block.timestamp);
    }

    function hasSigned(address account) external view returns (bool) {
        return agreements[account].exists;
    }
}