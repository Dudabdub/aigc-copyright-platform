// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CopyrightRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    struct CopyrightRecord {
        bytes32 imageHash;
        bytes32 watermarkedHash;
        bytes32 fingerprint;
        string imageCid;
        string watermarkedCid;
        string metadataCid;
        address owner;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => CopyrightRecord) private _records;
    mapping(address => bytes32[]) private _ownerRecords;

    uint256 public totalRegistrations;

    event CopyrightRegistered(
        bytes32 indexed imageHash,
        address indexed owner,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    function registerCopyright(
        bytes32 imageHash,
        bytes32 watermarkedHash,
        bytes32 fingerprint,
        string calldata imageCid,
        string calldata watermarkedCid,
        string calldata metadataCid
    ) external nonReentrant onlyRole(REGISTRAR_ROLE) {
        require(!_records[imageHash].exists, "Already registered");

        _records[imageHash] = CopyrightRecord({
            imageHash: imageHash,
            watermarkedHash: watermarkedHash,
            fingerprint: fingerprint,
            imageCid: imageCid,
            watermarkedCid: watermarkedCid,
            metadataCid: metadataCid,
            owner: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        _ownerRecords[msg.sender].push(imageHash);
        totalRegistrations++;

        emit CopyrightRegistered(imageHash, msg.sender, block.timestamp);
    }

    function verifyCopyright(bytes32 imageHash)
        external view
        returns (bool valid, address owner, uint256 timestamp)
    {
        CopyrightRecord storage r = _records[imageHash];
        return (r.exists, r.owner, r.timestamp);
    }

    function getRecord(bytes32 imageHash)
        external view
        returns (CopyrightRecord memory)
    {
        require(_records[imageHash].exists, "Not found");
        return _records[imageHash];
    }

    function getOwnerRecords(address owner)
        external view
        returns (bytes32[] memory)
    {
        return _ownerRecords[owner];
    }
}