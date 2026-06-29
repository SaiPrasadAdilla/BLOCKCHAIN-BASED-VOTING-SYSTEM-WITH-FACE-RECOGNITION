import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  RedisContext,
} from '@nestjs/microservices';
import { BlockchainService } from './blockchain.service';
import { Transport } from '@nestjs/microservices';
import { AuthGuard } from '../../guards/auth/auth.guard';
import { RoleGuard } from '../../guards/role/role.guard';
import { Role } from '../../decorators/role/role.decorator';

@Controller('blockchain')
@UseGuards(AuthGuard, RoleGuard)
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @MessagePattern({ cmd: 'generate_wallet' })
  generateWallet(@Payload() data: { network?: string }) {
    return this.blockchainService.generateWallet(data.network);
  }

  @MessagePattern({ cmd: 'create_transaction' })
  createTransaction(
    @Payload()
    data: {
      fromAddress: string;
      toAddress: string;
      amount: number;
      privateKey: string;
      network?: string;
    },
  ) {
    return this.blockchainService.createTransaction(
      data.fromAddress,
      data.toAddress,
      data.amount,
      data.privateKey,
      data.network,
    );
  }

  @MessagePattern({ cmd: 'get_balance' })
  getBalance(@Payload() data: { address: string; network?: string }) {
    return this.blockchainService.getBalance(data.address, data.network);
  }

  @MessagePattern({ cmd: 'validate_address' })
  validateAddress(@Payload() data: { address: string; network?: string }) {
    return this.blockchainService.validateAddress({
      address: data.address,
      network: data.network,
    });
  }

  @MessagePattern({ cmd: 'get_network_info' })
  getNetworkInfo(@Payload() data: { network?: string }) {
    return this.blockchainService.getNetworkInfo(data.network);
  }

  @MessagePattern({ cmd: 'sign_message' })
  signMessage(@Payload() data: { message: string; privateKey: string }) {
    return this.blockchainService.signMessage(data.message, data.privateKey);
  }

  @MessagePattern({ cmd: 'verify_signature' })
  verifySignature(
    @Payload()
    data: {
      message: string;
      signature: string;
      address: string;
    },
  ) {
    return this.blockchainService.verifySignature(
      data.message,
      data.signature,
      data.address,
    );
  }

  @MessagePattern({ cmd: 'estimate_gas' })
  estimateGas(
    @Payload()
    data: {
      fromAddress: string;
      toAddress: string;
      amount: number;
      network?: string;
    },
  ) {
    return this.blockchainService.estimateGas(
      data.fromAddress,
      data.toAddress,
      data.amount,
      data.network,
    );
  }

  @MessagePattern({ cmd: 'get_transaction_receipt' })
  getTransactionReceipt(@Payload() data: { txHash: string; network?: string }) {
    return this.blockchainService.getTransactionReceipt(
      data.txHash,
      data.network,
    );
  }

  @MessagePattern({ cmd: 'convert_address' })
  convertAddress(
    @Payload() data: { address: string; from: string; to: string },
  ) {
    return this.blockchainService.convertAddress(
      data.address,
      data.from,
      data.to,
    );
  }

  @Get('stats')
  @Role('super-admin', 'admin', 'owner', 'read')
  async getBlockchainStats() {
    return this.blockchainService.getBlockchainStats();
  }

  @Get('block/:blockNumber')
  @Role('super-admin', 'admin', 'owner', 'read')
  async getBlockDetails(@Param('blockNumber') blockNumber: number) {
    return this.blockchainService.getBlockDetails(blockNumber);
  }

  @Get('transaction/:txHash')
  @Role('super-admin', 'admin', 'owner', 'read')
  async getTransactionDetails(@Param('txHash') txHash: string) {
    return this.blockchainService.getTransactionDetails(txHash);
  }

  @Get('blocks')
  @Role('super-admin', 'admin')
  async getBlocks(
    @Query('startBlock') startBlock: string,
    @Query('endBlock') endBlock: string,
  ) {
    return this.blockchainService.getBlocks(
      parseInt(startBlock, 10),
      parseInt(endBlock, 10),
    );
  }

  @Get('transactions')
  @Role('super-admin', 'admin', 'owner', 'read')
  async getRecentTransactions(@Query('limit') limit?: string) {
    return this.blockchainService.getRecentTransactions(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('records')
  @Role('super-admin', 'admin', 'owner', 'read')
  async getBlockchainRecords(@Query('limit') limit?: string) {
    return this.blockchainService.getAllRecords(
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('record/:txHash')
  @Role('super-admin', 'admin', 'owner', 'read')
  async getBlockchainRecord(@Param('txHash') txHash: string) {
    return this.blockchainService.getRecordByTxHash(txHash);
  }
}
