// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SkillProof
 * @dev A smart contract for skill verification and NFT minting
 * @notice This contract allows users to submit skill verifications and mint NFTs as proof
 */
contract SkillProof is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Events
    event VerificationSubmitted(
        uint256 indexed verificationId,
        address indexed user,
        address indexed client,
        string name,
        string description,
        uint256 completedAt
    );

    event VerificationApproved(
        uint256 indexed verificationId,
        address indexed user,
        address indexed client
    );

    event VerificationRejected(
        uint256 indexed verificationId,
        address indexed user,
        address indexed client,
        string reason
    );

    event NFTMinted(
        uint256 indexed tokenId,
        uint256 indexed verificationId,
        address indexed user
    );

    event ClientRegistered(address indexed client, string name);
    event VerifierRegistered(address indexed verifier, string name);

    // Structs
    struct Verification {
        uint256 id;
        address user;
        address client;
        string name;
        string description;
        uint256 completedAt;
        uint256 submittedAt;
        VerificationStatus status;
        string[] skills;
        string metadataURI;
    }

    struct Client {
        address walletAddress;
        string name;
        bool isActive;
        uint256 verificationCount;
    }

    struct Verifier {
        address walletAddress;
        string name;
        bool isActive;
        uint256 approvedCount;
    }

    // Enums
    enum VerificationStatus {
        PENDING,
        APPROVED,
        REJECTED,
        NFT_MINTED
    }

    // State variables
    Counters.Counter private _verificationIds;
    Counters.Counter private _tokenIds;

    mapping(uint256 => Verification) public verifications;
    mapping(address => Client) public clients;
    mapping(address => Verifier) public verifiers;
    mapping(address => uint256[]) public userVerifications;
    mapping(address => uint256[]) public clientVerifications;
    mapping(uint256 => uint256) public verificationToTokenId;

    uint256 public verificationFee = 0.01 ether;
    uint256 public mintingFee = 0.005 ether;

    // Modifiers
    modifier onlyClient() {
        require(clients[msg.sender].isActive, "Only registered clients can call this");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender].isActive, "Only registered verifiers can call this");
        _;
    }

    modifier verificationExists(uint256 _verificationId) {
        require(_verificationId <= _verificationIds.current(), "Verification does not exist");
        _;
    }

    modifier onlyVerificationOwner(uint256 _verificationId) {
        require(verifications[_verificationId].user == msg.sender, "Not the verification owner");
        _;
    }

    // Constructor
    constructor() ERC721("SkillProof", "SKP") {
        // Register the contract deployer as the first verifier
        verifiers[msg.sender] = Verifier({
            walletAddress: msg.sender,
            name: "Contract Owner",
            isActive: true,
            approvedCount: 0
        });
    }

    // Client registration
    function registerClient(string memory _name) external {
        require(!clients[msg.sender].isActive, "Client already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");

        clients[msg.sender] = Client({
            walletAddress: msg.sender,
            name: _name,
            isActive: true,
            verificationCount: 0
        });

        emit ClientRegistered(msg.sender, _name);
    }

    // Verifier registration (only owner can add verifiers)
    function registerVerifier(address _verifier, string memory _name) external onlyOwner {
        require(!verifiers[_verifier].isActive, "Verifier already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");

        verifiers[_verifier] = Verifier({
            walletAddress: _verifier,
            name: _name,
            isActive: true,
            approvedCount: 0
        });

        emit VerifierRegistered(_verifier, _name);
    }

    // Submit verification
    function submitVerification(
        address _user,
        string memory _name,
        string memory _description,
        uint256 _completedAt,
        string[] memory _skills
    ) external onlyClient nonReentrant {
        require(_user != address(0), "Invalid user address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_completedAt <= block.timestamp, "Completion date cannot be in the future");
        require(_skills.length > 0, "At least one skill must be specified");

        _verificationIds.increment();
        uint256 verificationId = _verificationIds.current();

        verifications[verificationId] = Verification({
            id: verificationId,
            user: _user,
            client: msg.sender,
            name: _name,
            description: _description,
            completedAt: _completedAt,
            submittedAt: block.timestamp,
            status: VerificationStatus.PENDING,
            skills: _skills,
            metadataURI: ""
        });

        userVerifications[_user].push(verificationId);
        clientVerifications[msg.sender].push(verificationId);
        clients[msg.sender].verificationCount++;

        emit VerificationSubmitted(
            verificationId,
            _user,
            msg.sender,
            _name,
            _description,
            _completedAt
        );
    }

    // Approve verification (only verifiers can approve)
    function approveVerification(uint256 _verificationId) 
        external 
        onlyVerifier 
        verificationExists(_verificationId) 
    {
        Verification storage verification = verifications[_verificationId];
        require(verification.status == VerificationStatus.PENDING, "Verification not pending");

        verification.status = VerificationStatus.APPROVED;
        verifiers[msg.sender].approvedCount++;

        emit VerificationApproved(_verificationId, verification.user, verification.client);
    }

    // Reject verification (only verifiers can reject)
    function rejectVerification(uint256 _verificationId, string memory _reason) 
        external 
        onlyVerifier 
        verificationExists(_verificationId) 
    {
        Verification storage verification = verifications[_verificationId];
        require(verification.status == VerificationStatus.PENDING, "Verification not pending");

        verification.status = VerificationStatus.REJECTED;

        emit VerificationRejected(_verificationId, verification.user, verification.client, _reason);
    }

    // Mint NFT for approved verification
    function mintNFT(uint256 _verificationId, string memory _metadataURI) 
        external 
        payable 
        onlyVerificationOwner(_verificationId) 
        nonReentrant 
    {
        require(msg.value >= mintingFee, "Insufficient minting fee");
        require(verifications[_verificationId].status == VerificationStatus.APPROVED, "Verification not approved");
        require(verifications[_verificationId].status != VerificationStatus.NFT_MINTED, "NFT already minted");

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        verifications[_verificationId].status = VerificationStatus.NFT_MINTED;
        verifications[_verificationId].metadataURI = _metadataURI;
        verificationToTokenId[_verificationId] = tokenId;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _metadataURI);

        emit NFTMinted(tokenId, _verificationId, msg.sender);
    }

    // View functions
    function getVerification(uint256 _verificationId) 
        external 
        view 
        verificationExists(_verificationId) 
        returns (Verification memory) 
    {
        return verifications[_verificationId];
    }

    function getUserVerifications(address _user) external view returns (uint256[] memory) {
        return userVerifications[_user];
    }

    function getClientVerifications(address _client) external view returns (uint256[] memory) {
        return clientVerifications[_client];
    }

    function getVerificationSkills(uint256 _verificationId) 
        external 
        view 
        verificationExists(_verificationId) 
        returns (string[] memory) 
    {
        return verifications[_verificationId].skills;
    }

    function getClient(address _client) external view returns (Client memory) {
        return clients[_client];
    }

    function getVerifier(address _verifier) external view returns (Verifier memory) {
        return verifiers[_verifier];
    }

    function getTotalVerifications() external view returns (uint256) {
        return _verificationIds.current();
    }

    function getTotalNFTs() external view returns (uint256) {
        return _tokenIds.current();
    }

    // Admin functions
    function setVerificationFee(uint256 _fee) external onlyOwner {
        verificationFee = _fee;
    }

    function setMintingFee(uint256 _fee) external onlyOwner {
        mintingFee = _fee;
    }

    function deactivateClient(address _client) external onlyOwner {
        require(clients[_client].isActive, "Client not active");
        clients[_client].isActive = false;
    }

    function deactivateVerifier(address _verifier) external onlyOwner {
        require(verifiers[_verifier].isActive, "Verifier not active");
        verifiers[_verifier].isActive = false;
    }

    // Withdraw fees
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 