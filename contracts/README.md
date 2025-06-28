# SkillProof Smart Contracts

This repository contains the smart contracts for the SkillProof platform - a decentralized skill verification and NFT minting system.

## Overview

The SkillProof smart contract allows:
- **Clients** to submit skill verifications for users
- **Verifiers** to approve or reject verifications
- **Users** to mint NFTs as proof of their verified skills
- **Admin** to manage fees, clients, and verifiers

## Contract Features

### Core Functionality
- **Client Registration**: Organizations can register to submit verifications
- **Verifier Registration**: Trusted verifiers can approve/reject submissions
- **Verification Submission**: Clients submit skill verifications with metadata
- **NFT Minting**: Users can mint NFTs for approved verifications
- **Fee Management**: Configurable fees for verification and minting

### Security Features
- **Access Control**: Role-based permissions using OpenZeppelin's Ownable
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Input Validation**: Comprehensive validation for all inputs
- **Event Logging**: Full audit trail of all operations

## Contract Architecture

### Main Contract: `SkillProof.sol`
- **ERC721**: Standard NFT implementation
- **ERC721URIStorage**: Metadata storage for NFTs
- **Ownable**: Access control for admin functions
- **ReentrancyGuard**: Protection against reentrancy attacks

### Key Data Structures
```solidity
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

enum VerificationStatus {
    PENDING,
    APPROVED,
    REJECTED,
    NFT_MINTED
}
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MetaMask or similar wallet

### Installation

1. **Clone the repository**
   ```bash
   cd contracts
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   - Add your private key for deployment
   - Configure network URLs (Infura, Alchemy, etc.)
   - Add API keys for contract verification

3. **Compile Contracts**
   ```bash
   npm run compile
   ```

## Deployment

### Local Development
```bash
# Start local blockchain
npm run node

# Deploy to local network
npm run deploy:local
```

### Test Networks
```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to Polygon testnet
npm run deploy:polygon
```

### Mainnet
```bash
# Deploy to Ethereum mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Deploy to Polygon mainnet
npx hardhat run scripts/deploy.js --network polygon-mainnet
```

## Testing

Run the comprehensive test suite:
```bash
npm test
```

The tests cover:
- Contract deployment
- Client and verifier registration
- Verification submission and processing
- NFT minting
- Access control
- Error handling

## Usage Examples

### 1. Client Registration
```javascript
const skillProof = await ethers.getContract("SkillProof");
await skillProof.registerClient("Acme Corporation");
```

### 2. Submit Verification
```javascript
const skills = ["JavaScript", "React", "Node.js"];
await skillProof.submitVerification(
    userAddress,
    "Web Development Project",
    "Full-stack web application",
    completionTimestamp,
    skills
);
```

### 3. Approve Verification
```javascript
await skillProof.approveVerification(verificationId);
```

### 4. Mint NFT
```javascript
const mintingFee = await skillProof.mintingFee();
await skillProof.mintNFT(
    verificationId,
    "ipfs://QmMetadataHash",
    { value: mintingFee }
);
```

## Contract Functions

### Client Functions
- `registerClient(string name)` - Register as a client
- `submitVerification(address user, string name, string description, uint256 completedAt, string[] skills)` - Submit verification

### Verifier Functions
- `approveVerification(uint256 verificationId)` - Approve verification
- `rejectVerification(uint256 verificationId, string reason)` - Reject verification

### User Functions
- `mintNFT(uint256 verificationId, string metadataURI)` - Mint NFT for approved verification

### Admin Functions
- `registerVerifier(address verifier, string name)` - Register new verifier
- `setVerificationFee(uint256 fee)` - Set verification fee
- `setMintingFee(uint256 fee)` - Set minting fee
- `deactivateClient(address client)` - Deactivate client
- `deactivateVerifier(address verifier)` - Deactivate verifier
- `withdrawFees()` - Withdraw collected fees

### View Functions
- `getVerification(uint256 verificationId)` - Get verification details
- `getUserVerifications(address user)` - Get user's verifications
- `getClientVerifications(address client)` - Get client's verifications
- `getVerificationSkills(uint256 verificationId)` - Get verification skills
- `getClient(address client)` - Get client information
- `getVerifier(address verifier)` - Get verifier information

## Events

The contract emits events for all major operations:
- `VerificationSubmitted` - When verification is submitted
- `VerificationApproved` - When verification is approved
- `VerificationRejected` - When verification is rejected
- `NFTMinted` - When NFT is minted
- `ClientRegistered` - When client is registered
- `VerifierRegistered` - When verifier is registered

## Gas Optimization

The contract is optimized for gas efficiency:
- Uses efficient data structures
- Minimizes storage operations
- Implements proper access control
- Uses events for off-chain data

## Security Considerations

- **Access Control**: Only authorized users can perform specific actions
- **Input Validation**: All inputs are validated
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Fee Management**: Secure fee collection and withdrawal
- **Event Logging**: Full audit trail

## License

MIT License - see LICENSE file for details.

## Support

For questions or support, please open an issue in the repository. 