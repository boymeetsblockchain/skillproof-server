import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';

export interface VerificationSubmission {
  userAddress: string;
  name: string;
  description: string;
  completedAt: number;
  skills: string[];
}

export interface VerificationStatus {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NFT_MINTED';
  user: string;
  client: string;
  name: string;
  description: string;
  completedAt: number;
  submittedAt: number;
  skills: string[];
  metadataURI?: string;
}

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor(private configService: ConfigService) {
    this.initializeBlockchain();
  }

  private async initializeBlockchain() {
    try {
      // Initialize provider based on environment
      const networkUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL');
      const privateKey = this.configService.get<string>('BLOCKCHAIN_PRIVATE_KEY');
      const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

      if (!networkUrl || !privateKey || !contractAddress) {
        this.logger.warn('Blockchain configuration incomplete, running in offline mode');
        return;
      }

      this.provider = new ethers.JsonRpcProvider(networkUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Contract ABI - you'll need to import this from your compiled contract
      const contractABI = [
        // Client functions
        "function registerClient(string name) external",
        "function submitVerification(address user, string name, string description, uint256 completedAt, string[] skills) external",
        
        // Verifier functions
        "function approveVerification(uint256 verificationId) external",
        "function rejectVerification(uint256 verificationId, string reason) external",
        
        // User functions
        "function mintNFT(uint256 verificationId, string metadataURI) external payable",
        
        // View functions
        "function getVerification(uint256 verificationId) external view returns (tuple(uint256 id, address user, address client, string name, string description, uint256 completedAt, uint256 submittedAt, uint8 status, string[] skills, string metadataURI))",
        "function getUserVerifications(address user) external view returns (uint256[])",
        "function getClientVerifications(address client) external view returns (uint256[])",
        "function getVerificationSkills(uint256 verificationId) external view returns (string[])",
        "function getClient(address client) external view returns (tuple(address walletAddress, string name, bool isActive, uint256 verificationCount))",
        "function getVerifier(address verifier) external view returns (tuple(address walletAddress, string name, bool isActive, uint256 approvedCount))",
        "function getTotalVerifications() external view returns (uint256)",
        "function getTotalNFTs() external view returns (uint256)",
        "function verificationFee() external view returns (uint256)",
        "function mintingFee() external view returns (uint256)",
        
        // Events
        "event VerificationSubmitted(uint256 indexed verificationId, address indexed user, address indexed client, string name, string description, uint256 completedAt)",
        "event VerificationApproved(uint256 indexed verificationId, address indexed user, address indexed client)",
        "event VerificationRejected(uint256 indexed verificationId, address indexed user, address indexed client, string reason)",
        "event NFTMinted(uint256 indexed tokenId, uint256 indexed verificationId, address indexed user)",
        "event ClientRegistered(address indexed client, string name)",
        "event VerifierRegistered(address indexed verifier, string name)"
      ];

      this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
      
      this.logger.log('Blockchain service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize blockchain service', error);
    }
  }

  async registerClient(clientAddress: string, name: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const tx = await this.contract.registerClient(name);
      await tx.wait();
      
      this.logger.log(`Client ${name} registered successfully`);
      return true;
    } catch (error) {
      this.logger.error('Failed to register client', error);
      return false;
    }
  }

  async submitVerification(submission: VerificationSubmission, clientAddress: string): Promise<number | null> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const tx = await this.contract.submitVerification(
        submission.userAddress,
        submission.name,
        submission.description,
        submission.completedAt,
        submission.skills
      );
      
      const receipt = await tx.wait();
      
      // Get verification ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'VerificationSubmitted';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        const verificationId = parsed.args[0];
        
        this.logger.log(`Verification submitted with ID: ${verificationId}`);
        return Number(verificationId);
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to submit verification', error);
      return null;
    }
  }

  async approveVerification(verificationId: number): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const tx = await this.contract.approveVerification(verificationId);
      await tx.wait();
      
      this.logger.log(`Verification ${verificationId} approved successfully`);
      return true;
    } catch (error) {
      this.logger.error('Failed to approve verification', error);
      return false;
    }
  }

  async rejectVerification(verificationId: number, reason: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const tx = await this.contract.rejectVerification(verificationId, reason);
      await tx.wait();
      
      this.logger.log(`Verification ${verificationId} rejected: ${reason}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to reject verification', error);
      return false;
    }
  }

  async mintNFT(verificationId: number, metadataURI: string, userAddress: string): Promise<number | null> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const mintingFee = await this.contract.mintingFee();
      
      const tx = await this.contract.mintNFT(verificationId, metadataURI, {
        value: mintingFee
      });
      
      const receipt = await tx.wait();
      
      // Get token ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'NFTMinted';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        const tokenId = parsed.args[0];
        
        this.logger.log(`NFT minted with token ID: ${tokenId} for verification: ${verificationId}`);
        return Number(tokenId);
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to mint NFT', error);
      return null;
    }
  }

  async getVerification(verificationId: number): Promise<VerificationStatus | null> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const verification = await this.contract.getVerification(verificationId);
      
      const statusMap = ['PENDING', 'APPROVED', 'REJECTED', 'NFT_MINTED'];
      
      return {
        id: Number(verification.id),
        status: statusMap[verification.status] as any,
        user: verification.user,
        client: verification.client,
        name: verification.name,
        description: verification.description,
        completedAt: Number(verification.completedAt),
        submittedAt: Number(verification.submittedAt),
        skills: verification.skills,
        metadataURI: verification.metadataURI || undefined
      };
    } catch (error) {
      this.logger.error('Failed to get verification', error);
      return null;
    }
  }

  async getUserVerifications(userAddress: string): Promise<number[]> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const verificationIds = await this.contract.getUserVerifications(userAddress);
      return verificationIds.map(id => Number(id));
    } catch (error) {
      this.logger.error('Failed to get user verifications', error);
      return [];
    }
  }

  async getClientVerifications(clientAddress: string): Promise<number[]> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const verificationIds = await this.contract.getClientVerifications(clientAddress);
      return verificationIds.map(id => Number(id));
    } catch (error) {
      this.logger.error('Failed to get client verifications', error);
      return [];
    }
  }

  async getVerificationSkills(verificationId: number): Promise<string[]> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      return await this.contract.getVerificationSkills(verificationId);
    } catch (error) {
      this.logger.error('Failed to get verification skills', error);
      return [];
    }
  }

  async getClient(clientAddress: string): Promise<any> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const client = await this.contract.getClient(clientAddress);
      return {
        walletAddress: client.walletAddress,
        name: client.name,
        isActive: client.isActive,
        verificationCount: Number(client.verificationCount)
      };
    } catch (error) {
      this.logger.error('Failed to get client', error);
      return null;
    }
  }

  async getVerifier(verifierAddress: string): Promise<any> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const verifier = await this.contract.getVerifier(verifierAddress);
      return {
        walletAddress: verifier.walletAddress,
        name: verifier.name,
        isActive: verifier.isActive,
        approvedCount: Number(verifier.approvedCount)
      };
    } catch (error) {
      this.logger.error('Failed to get verifier', error);
      return null;
    }
  }

  async getTotalVerifications(): Promise<number> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const total = await this.contract.getTotalVerifications();
      return Number(total);
    } catch (error) {
      this.logger.error('Failed to get total verifications', error);
      return 0;
    }
  }

  async getTotalNFTs(): Promise<number> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const total = await this.contract.getTotalNFTs();
      return Number(total);
    } catch (error) {
      this.logger.error('Failed to get total NFTs', error);
      return 0;
    }
  }

  async getFees(): Promise<{ verificationFee: string; mintingFee: string }> {
    try {
      if (!this.contract) {
        throw new Error('Blockchain service not initialized');
      }

      const verificationFee = await this.contract.verificationFee();
      const mintingFee = await this.contract.mintingFee();

      return {
        verificationFee: ethers.formatEther(verificationFee),
        mintingFee: ethers.formatEther(mintingFee)
      };
    } catch (error) {
      this.logger.error('Failed to get fees', error);
      return { verificationFee: '0', mintingFee: '0' };
    }
  }

  // Listen to blockchain events
  async listenToEvents() {
    if (!this.contract) {
      this.logger.warn('Cannot listen to events: blockchain service not initialized');
      return;
    }

    this.contract.on('VerificationSubmitted', (verificationId, user, client, name, description, completedAt) => {
      this.logger.log(`New verification submitted: ${verificationId} by ${user} for ${client}`);
    });

    this.contract.on('VerificationApproved', (verificationId, user, client) => {
      this.logger.log(`Verification approved: ${verificationId} for ${user}`);
    });

    this.contract.on('VerificationRejected', (verificationId, user, client, reason) => {
      this.logger.log(`Verification rejected: ${verificationId} for ${user} - ${reason}`);
    });

    this.contract.on('NFTMinted', (tokenId, verificationId, user) => {
      this.logger.log(`NFT minted: Token ${tokenId} for verification ${verificationId} by ${user}`);
    });

    this.logger.log('Listening to blockchain events...');
  }
} 