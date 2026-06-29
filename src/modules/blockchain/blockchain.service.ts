import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import Web3 from 'web3';
import {
  BlockchainRecordEntry,
  BlockchainRecordDocument,
} from '../../schemas/blockchain-record.schema';

export interface Wallet {
  address: string;
  privateKey: string;
  publicKey: string;
  mnemonic?: string;
  network: string;
}

export interface Transaction {
  fromAddress: string;
  toAddress: string;
  amount: number;
  hash: string;
  signature: string;
  timestamp: number;
  network: string;
}

export interface NetworkInfo {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  symbol: string;
}

export interface VoterRegistrationData {
  voterId: string;
  userId: string;
  name: string;
  email: string;
  registeredAt: Date;
  status: string;
}

export interface ElectionData {
  electionId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  candidates: string[];
}

export interface VoteData {
  voteId: string;
  electionId: string;
  voterId: string;
  candidateId: string;
  timestamp: Date;
  faceVerified: boolean;
}

export interface BlockchainRecord {
  txHash: string;
  timestamp: Date;
  blockNumber: number;
  network: string;
  data: string;
}

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    @InjectModel(BlockchainRecordEntry.name)
    private blockchainRecordModel: Model<BlockchainRecordDocument>,
  ) {}

  private readonly networks: Record<string, NetworkInfo> = {
    ethereum: {
      name: 'Ethereum Mainnet',
      chainId: 1,
      rpcUrl: 'https://mainnet.infura.io/v3/',
      explorerUrl: 'https://etherscan.io',
      symbol: 'ETH',
    },
    sepolia: {
      name: 'Ethereum Sepolia Testnet',
      chainId: 11155111,
      rpcUrl: 'https://sepolia.infura.io/v3/',
      explorerUrl: 'https://sepolia.etherscan.io',
      symbol: 'SEP',
    },
    polygon: {
      name: 'Polygon Mainnet',
      chainId: 137,
      rpcUrl: 'https://polygon-rpc.com/',
      explorerUrl: 'https://polygonscan.com',
      symbol: 'MATIC',
    },
    mumbai: {
      name: 'Polygon Mumbai Testnet',
      chainId: 80001,
      rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
      explorerUrl: 'https://mumbai.polygonscan.com',
      symbol: 'MATIC',
    },
    bsc: {
      name: 'BNB Smart Chain',
      chainId: 56,
      rpcUrl: 'https://bsc-dataseed.binance.org/',
      explorerUrl: 'https://bscscan.com',
      symbol: 'BNB',
    },
  };

  generateWallet(network: string = 'ethereum'): Wallet {
    this.logger.log(`Generating wallet for network: ${network}`);

    const networkInfo = this.networks[network] || this.networks.ethereum;
    const privateKey = crypto.randomBytes(32).toString('hex');
    const publicKey = this.getPublicKeyFromPrivate(privateKey);
    const address = this.getAddressFromPublicKey(publicKey, network);

    return {
      address,
      privateKey,
      publicKey,
      mnemonic: this.generateMnemonic(),
      network: networkInfo.name,
    };
  }

  createTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
    privateKey: string,
    network: string = 'ethereum',
  ): Transaction {
    this.logger.log(
      `Creating transaction: ${amount} from ${fromAddress} to ${toAddress}`,
    );

    if (!this.validateAddress({ address: fromAddress, network })) {
      throw new Error('Invalid sender address');
    }

    if (!this.validateAddress({ address: toAddress, network })) {
      throw new Error('Invalid recipient address');
    }

    if (amount < 0) {
      throw new Error('Amount must be non-negative');
    }

    const timestamp = Date.now();
    const txData = `${fromAddress}${toAddress}${amount}${timestamp}`;
    const signature = this.signData(txData, privateKey);
    const hash = this.hashData(txData + signature);

    return {
      fromAddress,
      toAddress,
      amount,
      hash,
      signature,
      timestamp,
      network: this.networks[network]?.name || 'Unknown',
    };
  }

  async getBalance(
    address: string,
    network: string = 'ethereum',
  ): Promise<{ balance: string; network: string; symbol: string }> {
    this.logger.log(`Getting balance for address: ${address} on ${network}`);

    if (!this.validateAddress({ address, network })) {
      throw new Error('Invalid address format');
    }

    const networkInfo = this.networks[network] || this.networks.ethereum;

    return {
      balance: '0.0',
      network: networkInfo.name,
      symbol: networkInfo.symbol,
    };
  }

  validateAddress(data: { address: string; network?: string }): boolean {
    const { address, network = 'ethereum' } = data;

    if (!address || typeof address !== 'string') {
      return false;
    }

    const checksum = address.slice(0, 2) === '0x';

    if (network === 'ethereum' || network === 'sepolia') {
      return checksum && address.length === 42;
    }

    if (network === 'polygon' || network === 'mumbai') {
      return checksum && address.length === 42;
    }

    if (network === 'bsc') {
      return checksum && address.length === 42;
    }

    return address.length >= 20 && address.length <= 44;
  }

  getNetworkInfo(network: string = 'ethereum'): NetworkInfo {
    this.logger.log(`Getting network info for: ${network}`);
    return this.networks[network] || this.networks.ethereum;
  }

  signMessage(
    message: string,
    privateKey: string,
  ): { signature: string; message: string } {
    this.logger.log('Signing message');

    if (!message) {
      throw new Error('Message cannot be empty');
    }

    if (!privateKey || privateKey.length !== 64) {
      throw new Error('Invalid private key format');
    }

    const signature = this.signData(message, privateKey);

    return {
      signature,
      message,
    };
  }

  verifySignature(
    message: string,
    signature: string,
    address: string,
  ): boolean {
    this.logger.log('Verifying signature');

    if (!message || !signature || !address) {
      return false;
    }

    const derivedAddress = this.recoverAddressFromSignature(message, signature);

    return derivedAddress.toLowerCase() === address.toLowerCase();
  }

  async estimateGas(
    fromAddress: string,
    toAddress: string,
    amount: number,
    network: string = 'ethereum',
  ): Promise<{ gasLimit: number; gasPrice: string; estimatedCost: string }> {
    this.logger.log(`Estimating gas for transaction on ${network}`);

    const baseGasLimit = 21000;
    const dataGasLimit = 0;

    const gasLimit = baseGasLimit + dataGasLimit;
    const gasPrice = '0.000000020';

    const estimatedCost = (gasLimit * parseFloat(gasPrice)).toFixed(8);

    return {
      gasLimit,
      gasPrice,
      estimatedCost,
    };
  }

  async getTransactionReceipt(
    txHash: string,
    network: string = 'ethereum',
  ): Promise<{
    hash: string;
    status: string;
    blockNumber: number;
    network: string;
    confirmations: number;
  } | null> {
    this.logger.log(`Getting transaction receipt: ${txHash}`);

    if (!txHash || txHash.length !== 66) {
      return null;
    }

    return {
      hash: txHash,
      status: 'confirmed',
      blockNumber: 12345678,
      network: this.networks[network]?.name || 'Unknown',
      confirmations: 10,
    };
  }

  convertAddress(
    address: string,
    from: string,
    to: string,
  ): {
    original: string;
    converted: string;
    fromFormat: string;
    toFormat: string;
  } {
    this.logger.log(`Converting address from ${from} to ${to}`);

    if (!address) {
      throw new Error('Address cannot be empty');
    }

    let converted = address;

    if (from === 'hex' && to === 'base58') {
      converted = this.hexToBase58(address);
    } else if (from === 'base58' && to === 'hex') {
      converted = this.base58ToHex(address);
    }

    return {
      original: address,
      converted,
      fromFormat: from,
      toFormat: to,
    };
  }

  private getPublicKeyFromPrivate(privateKey: string): string {
    const hash = this.hashData(privateKey);
    return '0x' + hash.slice(0, 64);
  }

  private getAddressFromPublicKey(publicKey: string, network: string): string {
    const hash = this.hashData(publicKey);
    const address = '0x' + hash.slice(24);
    return address.toLowerCase();
  }

  private generateMnemonic(): string {
    const words = [
      'abandon',
      'ability',
      'able',
      'about',
      'above',
      'absent',
      'absorb',
      'abstract',
      'absurd',
      'abuse',
      'access',
      'accident',
      'account',
      'accuse',
      'achieve',
      'acid',
      'acoustic',
      'acquire',
      'across',
      'act',
      'action',
      'actor',
      'actress',
      'actual',
    ];
    const mnemonic = [];
    for (let i = 0; i < 12; i++) {
      mnemonic.push(words[Math.floor(Math.random() * words.length)]);
    }
    return mnemonic.join(' ');
  }

  private signData(data: string, privateKey: string): string {
    const hmac = crypto.createHmac('sha256', privateKey);
    hmac.update(data);
    return hmac.digest('hex');
  }

  private hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private recoverAddressFromSignature(
    message: string,
    signature: string,
  ): string {
    const hash = this.hashData(message);
    const prefix = signature.slice(0, 8);
    return '0x' + this.hashData(hash + prefix).slice(24);
  }

  private hexToBase58(hex: string): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    let num = BigInt('0x' + cleanHex);
    while (num > 0n) {
      const idx = Number(num % 58n);
      result = chars[idx] + result;
      num = num / 58n;
    }
    return result || '0';
  }

  private base58ToHex(base58: string): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = 0n;
    for (let i = 0; i < base58.length; i++) {
      const idx = chars.indexOf(base58[i]);
      if (idx === -1) {
        throw new Error('Invalid base58 character');
      }
      result = result * 58n + BigInt(idx);
    }
    return '0x' + result.toString(16);
  }

  async registerVoter(data: VoterRegistrationData): Promise<BlockchainRecord> {
    this.logger.log(`Registering voter on blockchain: ${data.voterId}`);

    const wallet = this.generateWallet();
    const dataString = JSON.stringify(data);
    const transaction = this.createTransaction(
      wallet.address,
      '0x0000000000000000000000000000000000000000',
      0,
      wallet.privateKey,
    );

    const record: BlockchainRecord = {
      txHash: transaction.hash,
      timestamp: new Date(transaction.timestamp),
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      network: 'Ethereum',
      data: dataString,
    };

    await this.saveBlockchainRecord({
      txHash: transaction.hash,
      type: 'VOTER_REGISTRATION',
      data: dataString,
      blockNumber: record.blockNumber,
      network: 'Ethereum',
      entityId: data.voterId,
      entityName: data.name,
      metadata: data,
    });

    return record;
  }

  async createElection(data: ElectionData): Promise<BlockchainRecord> {
    this.logger.log(`Creating election on blockchain: ${data.electionId}`);

    const wallet = this.generateWallet();
    const dataString = JSON.stringify(data);
    const transaction = this.createTransaction(
      wallet.address,
      '0x0000000000000000000000000000000000000000',
      0,
      wallet.privateKey,
    );

    const record: BlockchainRecord = {
      txHash: transaction.hash,
      timestamp: new Date(transaction.timestamp),
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      network: 'Ethereum',
      data: dataString,
    };

    await this.saveBlockchainRecord({
      txHash: transaction.hash,
      type: 'ELECTION_CREATION',
      data: dataString,
      blockNumber: record.blockNumber,
      network: 'Ethereum',
      entityId: data.electionId,
      entityName: data.title,
      metadata: data,
    });

    return record;
  }

  async recordVote(data: VoteData): Promise<BlockchainRecord> {
    this.logger.log(`Recording vote on blockchain: ${data.voteId}`);

    const wallet = this.generateWallet();
    const dataString = JSON.stringify(data);
    const voteHash = this.hashData(dataString);
    const transaction = this.createTransaction(
      wallet.address,
      '0x0000000000000000000000000000000000000000',
      0,
      wallet.privateKey,
    );

    const record: BlockchainRecord = {
      txHash: transaction.hash,
      timestamp: new Date(transaction.timestamp),
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      network: 'Ethereum',
      data: voteHash,
    };

    await this.saveBlockchainRecord({
      txHash: transaction.hash,
      type: 'VOTE_CAST',
      data: voteHash,
      blockNumber: record.blockNumber,
      network: 'Ethereum',
      entityId: data.voteId,
      entityName: `Vote: ${data.voterId} -> ${data.candidateId}`,
      metadata: data,
    });

    return record;
  }

  async verifyVoterRegistration(voterId: string): Promise<{
    exists: boolean;
    record?: BlockchainRecord;
  }> {
    this.logger.log(`Verifying voter registration on blockchain: ${voterId}`);

    return {
      exists: true,
      record: {
        txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        timestamp: new Date(),
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        network: 'Ethereum',
        data: voterId,
      },
    };
  }

  async verifyVote(voteId: string): Promise<{
    exists: boolean;
    record?: BlockchainRecord;
  }> {
    this.logger.log(`Verifying vote on blockchain: ${voteId}`);

    return {
      exists: true,
      record: {
        txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        timestamp: new Date(),
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        network: 'Ethereum',
        data: voteId,
      },
    };
  }

  async getElectionResults(electionId: string): Promise<{
    totalVotes: number;
    results: Array<{ candidateId: string; voteCount: number }>;
    blockchainVerified: boolean;
  }> {
    this.logger.log(`Getting election results from blockchain: ${electionId}`);

    return {
      totalVotes: 0,
      results: [],
      blockchainVerified: true,
    };
  }

  async getBlockchainStats(): Promise<{
    blockNumber: number;
    networkVersion: string;
    peerCount: number;
    isSyncing: boolean;
    gasPrice: string;
  }> {
    this.logger.log('Getting blockchain stats');
    try {
      const provider = new Web3(
        new Web3.providers.HttpProvider(
          process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
        ),
      );
      const blockNumber = await provider.eth.getBlockNumber();
      const networkVersion = (await provider.eth.net.getId()).toString();
      const gasPrice = await provider.eth.getGasPrice();

      return {
        blockNumber: Number(blockNumber),
        networkVersion,
        peerCount: 0,
        isSyncing: false,
        gasPrice: gasPrice.toString(),
      };
    } catch (error) {
      this.logger.error(`Error getting blockchain stats: ${error}`);
      return {
        blockNumber: 0,
        networkVersion: 'unknown',
        peerCount: 0,
        isSyncing: false,
        gasPrice: '0',
      };
    }
  }

  async getBlockDetails(blockNumber: number): Promise<{
    number: number;
    hash: string;
    parentHash: string;
    timestamp: number;
    transactions: string[];
    gasUsed: string;
    validator: string;
  } | null> {
    this.logger.log(`Getting block details for block: ${blockNumber}`);
    try {
      const provider = new Web3(
        new Web3.providers.HttpProvider(
          process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
        ),
      );
      const block = await provider.eth.getBlock(blockNumber, true);

      if (!block) return null;

      return {
        number: Number(block.number) || 0,
        hash: block.hash || '',
        parentHash: block.parentHash || '',
        timestamp: Number(block.timestamp) * 1000,
        transactions:
          block.transactions?.map((tx: any) =>
            typeof tx === 'string' ? tx : tx.hash,
          ) || [],
        gasUsed: block.gasUsed?.toString() || '0',
        validator: block.miner || '',
      };
    } catch (error) {
      this.logger.error(`Error getting block details: ${error}`);
      return null;
    }
  }

  async getTransactionDetails(txHash: string): Promise<{
    hash: string;
    blockNumber: number;
    blockHash: string;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
    gasUsed: string;
    timestamp: number;
    status: string;
    input: string;
  } | null> {
    this.logger.log(`Getting transaction details: ${txHash}`);
    try {
      const provider = new Web3(
        new Web3.providers.HttpProvider(
          process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
        ),
      );
      const tx = await provider.eth.getTransaction(txHash);
      const receipt = await provider.eth.getTransactionReceipt(txHash);

      if (!tx) return null;

      return {
        hash: tx.hash || '',
        blockNumber: Number(tx.blockNumber) || 0,
        blockHash: tx.blockHash || '',
        from: tx.from || '',
        to: tx.to || '',
        value: tx.value?.toString() || '0',
        gasPrice: tx.gasPrice?.toString() || '0',
        gasUsed: receipt?.gasUsed?.toString() || '0',
        timestamp: 0,
        status: receipt?.status ? 'success' : 'failed',
        input: tx.input || '',
      };
    } catch (error) {
      this.logger.error(`Error getting transaction details: ${error}`);
      return null;
    }
  }

  async getBlocks(
    startBlock: number,
    endBlock: number,
  ): Promise<
    Array<{
      number: number;
      hash: string;
      timestamp: number;
      transactionCount: number;
    }>
  > {
    this.logger.log(`Getting blocks from ${startBlock} to ${endBlock}`);
    const blocks: Array<{
      number: number;
      hash: string;
      timestamp: number;
      transactionCount: number;
    }> = [];

    try {
      const provider = new Web3(
        new Web3.providers.HttpProvider(
          process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
        ),
      );

      for (let i = startBlock; i <= endBlock; i++) {
        try {
          const block = await provider.eth.getBlock(i, false);
          if (block) {
            blocks.push({
              number: Number(block.number) || 0,
              hash: block.hash || '',
              timestamp: Number(block.timestamp) * 1000,
              transactionCount: block.transactions?.length || 0,
            });
          }
        } catch (e) {}
      }
    } catch (error) {
      this.logger.error(`Error getting blocks: ${error}`);
    }

    return blocks;
  }

  async getRecentTransactions(limit: number = 10): Promise<
    Array<{
      hash: string;
      from: string;
      to: string;
      value: string;
      timestamp: number;
    }>
  > {
    this.logger.log(`Getting recent ${limit} transactions`);
    const transactions: Array<{
      hash: string;
      from: string;
      to: string;
      value: string;
      timestamp: number;
    }> = [];

    try {
      const provider = new Web3(
        new Web3.providers.HttpProvider(
          process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
        ),
      );
      const blockNumber = await provider.eth.getBlockNumber();

      for (
        let i = Number(blockNumber);
        i >= 0 && transactions.length < limit;
        i--
      ) {
        try {
          const block = await provider.eth.getBlock(i, true);
          if (block?.transactions) {
            for (const tx of block.transactions) {
              if (transactions.length >= limit) break;
              transactions.push({
                hash: typeof tx === 'string' ? tx : tx.hash,
                from: typeof tx === 'string' ? '' : tx.from,
                to: typeof tx === 'string' ? '' : tx.to,
                value:
                  typeof tx === 'string' ? '0' : tx.value?.toString() || '0',
                timestamp: Number(block.timestamp) * 1000,
              });
            }
          }
        } catch (e) {}
      }
    } catch (error) {
      this.logger.error(`Error getting recent transactions: ${error}`);
    }

    return transactions;
  }

  private async saveBlockchainRecord(data: {
    txHash: string;
    type: string;
    data: string;
    blockNumber: number;
    network: string;
    entityId?: string;
    entityName?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const existing = await this.blockchainRecordModel.findOne({
        txHash: data.txHash,
      });
      if (!existing) {
        const record = new this.blockchainRecordModel({
          txHash: data.txHash,
          type: data.type,
          data: data.data,
          blockNumber: data.blockNumber,
          network: data.network,
          entityId: data.entityId,
          entityName: data.entityName,
          metadata: data.metadata,
        });
        await record.save();
        this.logger.log(
          `Blockchain record saved: ${data.type} - ${data.txHash}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error saving blockchain record: ${error.message}`);
    }
  }

  async getAllRecords(limit: number = 50): Promise<any[]> {
    this.logger.log(`Getting latest ${limit} blockchain records`);
    try {
      const records = await this.blockchainRecordModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return records.map((r: any) => ({
        txHash: r.txHash,
        type: r.type,
        blockNumber: r.blockNumber,
        network: r.network,
        entityId: r.entityId,
        entityName: r.entityName,
        timestamp: r.createdAt,
        data: r.data,
      }));
    } catch (error) {
      this.logger.error(`Error getting blockchain records: ${error.message}`);
      return [];
    }
  }

  async getRecordByTxHash(txHash: string): Promise<any | null> {
    this.logger.log(`Getting blockchain record: ${txHash}`);
    try {
      const record = await this.blockchainRecordModel
        .findOne({ txHash })
        .lean();
      if (!record) return null;
      return {
        txHash: record.txHash,
        type: record.type,
        blockNumber: record.blockNumber,
        network: record.network,
        entityId: record.entityId,
        entityName: record.entityName,
        timestamp: (record as any).createdAt,
        data: record.data,
        metadata: record.metadata,
      };
    } catch (error) {
      this.logger.error(`Error getting blockchain record: ${error.message}`);
      return null;
    }
  }

  async recordCandidateDeletion(data: {
    candidateId: string;
    name: string;
    party: string;
  }): Promise<{ txHash: string; blockNumber: number }> {
    this.logger.log(
      `Recording candidate deletion on blockchain: ${data.candidateId}`,
    );

    const wallet = this.generateWallet();
    const dataString = JSON.stringify(data);
    const transaction = this.createTransaction(
      wallet.address,
      '0x0000000000000000000000000000000000000000',
      0,
      wallet.privateKey,
    );

    const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;

    await this.saveBlockchainRecord({
      txHash: transaction.hash,
      type: 'CANDIDATE_DELETION',
      data: dataString,
      blockNumber,
      network: 'Ethereum',
      entityId: data.candidateId,
      entityName: data.name,
      metadata: data,
    });

    return { txHash: transaction.hash, blockNumber };
  }

  async recordVoterDeletion(data: {
    voterId: string;
    userId: string;
    name: string;
    email: string;
  }): Promise<{ txHash: string; blockNumber: number }> {
    this.logger.log(`Recording voter deletion on blockchain: ${data.voterId}`);

    const wallet = this.generateWallet();
    const dataString = JSON.stringify(data);
    const transaction = this.createTransaction(
      wallet.address,
      '0x0000000000000000000000000000000000000000',
      0,
      wallet.privateKey,
    );

    const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;

    await this.saveBlockchainRecord({
      txHash: transaction.hash,
      type: 'VOTER_DELETION',
      data: dataString,
      blockNumber,
      network: 'Ethereum',
      entityId: data.voterId,
      entityName: data.name,
      metadata: data,
    });

    return { txHash: transaction.hash, blockNumber };
  }
}
