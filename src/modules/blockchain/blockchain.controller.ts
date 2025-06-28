import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BlockchainService, VerificationSubmission } from './blockchain.service';
import { AuthGuard } from '../../guards/auth-guard';

@Controller('blockchain')
@UseGuards(AuthGuard)
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('client/register')
  async registerClient(@Body() body: { name: string; clientAddress: string }) {
    const success = await this.blockchainService.registerClient(
      body.clientAddress,
      body.name
    );
    return { success };
  }

  @Post('verification/submit')
  async submitVerification(@Body() submission: VerificationSubmission & { clientAddress: string }) {
    const { clientAddress, ...verificationData } = submission;
    const verificationId = await this.blockchainService.submitVerification(
      verificationData,
      clientAddress
    );
    return { verificationId, success: verificationId !== null };
  }

  @Post('verification/:id/approve')
  async approveVerification(@Param('id') id: string) {
    const success = await this.blockchainService.approveVerification(Number(id));
    return { success };
  }

  @Post('verification/:id/reject')
  async rejectVerification(
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    const success = await this.blockchainService.rejectVerification(
      Number(id),
      body.reason
    );
    return { success };
  }

  @Post('verification/:id/mint')
  async mintNFT(
    @Param('id') id: string,
    @Body() body: { metadataURI: string; userAddress: string }
  ) {
    const tokenId = await this.blockchainService.mintNFT(
      Number(id),
      body.metadataURI,
      body.userAddress
    );
    return { tokenId, success: tokenId !== null };
  }

  @Get('verification/:id')
  async getVerification(@Param('id') id: string) {
    const verification = await this.blockchainService.getVerification(Number(id));
    return { verification };
  }

  @Get('user/:address/verifications')
  async getUserVerifications(@Param('address') address: string) {
    const verificationIds = await this.blockchainService.getUserVerifications(address);
    return { verificationIds };
  }

  @Get('client/:address/verifications')
  async getClientVerifications(@Param('address') address: string) {
    const verificationIds = await this.blockchainService.getClientVerifications(address);
    return { verificationIds };
  }

  @Get('verification/:id/skills')
  async getVerificationSkills(@Param('id') id: string) {
    const skills = await this.blockchainService.getVerificationSkills(Number(id));
    return { skills };
  }

  @Get('client/:address')
  async getClient(@Param('address') address: string) {
    const client = await this.blockchainService.getClient(address);
    return { client };
  }

  @Get('verifier/:address')
  async getVerifier(@Param('address') address: string) {
    const verifier = await this.blockchainService.getVerifier(address);
    return { verifier };
  }

  @Get('stats')
  async getStats() {
    const [totalVerifications, totalNFTs, fees] = await Promise.all([
      this.blockchainService.getTotalVerifications(),
      this.blockchainService.getTotalNFTs(),
      this.blockchainService.getFees(),
    ]);

    return {
      totalVerifications,
      totalNFTs,
      fees,
    };
  }
} 