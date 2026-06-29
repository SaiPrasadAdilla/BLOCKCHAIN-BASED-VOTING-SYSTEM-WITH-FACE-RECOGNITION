import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService, Wallet, Transaction } from './blockchain.service';

describe('BlockchainService', () => {
  let service: BlockchainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateWallet', () => {
    it('should generate a valid wallet for ethereum network', () => {
      const wallet = service.generateWallet('ethereum');

      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
      expect(wallet.privateKey).toBeDefined();
      expect(wallet.publicKey).toBeDefined();
      expect(wallet.mnemonic).toBeDefined();
      expect(wallet.network).toBe('Ethereum Mainnet');
    });

    it('should generate a valid wallet for polygon network', () => {
      const wallet = service.generateWallet('polygon');

      expect(wallet.network).toBe('Polygon Mainnet');
      expect(wallet.address.length).toBeGreaterThan(0);
    });

    it('should generate a valid wallet for bsc network', () => {
      const wallet = service.generateWallet('bsc');

      expect(wallet.network).toBe('BNB Smart Chain');
    });

    it('should default to ethereum for unknown network', () => {
      const wallet = service.generateWallet('unknown');

      expect(wallet.network).toBe('Ethereum Mainnet');
    });

    it('should generate private key with 64 hex characters', () => {
      const wallet = service.generateWallet('ethereum');

      expect(wallet.privateKey.length).toBe(64);
      expect(/^[0-9a-f]+$/i.test(wallet.privateKey)).toBe(true);
    });

    it('should generate address starting with 0x', () => {
      const wallet = service.generateWallet('ethereum');

      expect(wallet.address.startsWith('0x')).toBe(true);
    });

    it('should generate unique wallets each time', () => {
      const wallet1 = service.generateWallet('ethereum');
      const wallet2 = service.generateWallet('ethereum');

      expect(wallet1.address).not.toEqual(wallet2.address);
      expect(wallet1.privateKey).not.toEqual(wallet2.privateKey);
    });

    it('should generate mnemonic with 12 words', () => {
      const wallet = service.generateWallet('ethereum');
      const words = wallet.mnemonic?.split(' ');

      expect(words?.length).toBe(12);
    });
  });

  describe('createTransaction', () => {
    it('should create a valid transaction', () => {
      const fromAddress = '0x1234567890123456789012345678901234567890';
      const toAddress = '0x0987654321098765432109876543210987654321';
      const amount = 1.5;
      const privateKey = 'a'.repeat(64);
      const network = 'ethereum';

      const transaction = service.createTransaction(
        fromAddress,
        toAddress,
        amount,
        privateKey,
        network,
      );

      expect(transaction).toBeDefined();
      expect(transaction.fromAddress).toBe(fromAddress);
      expect(transaction.toAddress).toBe(toAddress);
      expect(transaction.amount).toBe(amount);
      expect(transaction.hash).toBeDefined();
      expect(transaction.signature).toBeDefined();
      expect(transaction.timestamp).toBeDefined();
      expect(transaction.network).toBe('Ethereum Mainnet');
    });

    it('should throw error for invalid sender address', () => {
      expect(() =>
        service.createTransaction(
          'invalid',
          '0x0987654321098765432109876543210987654321',
          1,
          'a'.repeat(64),
        ),
      ).toThrow('Invalid sender address');
    });

    it('should throw error for invalid recipient address', () => {
      expect(() =>
        service.createTransaction(
          '0x1234567890123456789012345678901234567890',
          'invalid',
          1,
          'a'.repeat(64),
        ),
      ).toThrow('Invalid recipient address');
    });

    it('should throw error for negative amount', () => {
      expect(() =>
        service.createTransaction(
          '0x1234567890123456789012345678901234567890',
          '0x0987654321098765432109876543210987654321',
          -1,
          'a'.repeat(64),
        ),
      ).toThrow('Amount must be positive');
    });

    it('should throw error for zero amount', () => {
      expect(() =>
        service.createTransaction(
          '0x1234567890123456789012345678901234567890',
          '0x0987654321098765432109876543210987654321',
          0,
          'a'.repeat(64),
        ),
      ).toThrow('Amount must be positive');
    });

    it('should generate valid transaction hash format', () => {
      const tx = service.createTransaction(
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
        1,
        'a'.repeat(64),
      );

      expect(tx.hash).toBeDefined();
      expect(typeof tx.hash).toBe('string');
      expect(tx.hash.length).toBeGreaterThan(0);
    });
  });

  describe('getBalance', () => {
    it('should return balance for valid ethereum address', async () => {
      const result = await service.getBalance(
        '0x1234567890123456789012345678901234567890',
        'ethereum',
      );

      expect(result).toBeDefined();
      expect(result.network).toBe('Ethereum Mainnet');
      expect(result.symbol).toBe('ETH');
      expect(result.balance).toBe('0.0');
    });

    it('should throw error for invalid address', async () => {
      await expect(service.getBalance('invalid', 'ethereum')).rejects.toThrow(
        'Invalid address format',
      );
    });

    it('should return balance for polygon network', async () => {
      const result = await service.getBalance(
        '0x1234567890123456789012345678901234567890',
        'polygon',
      );

      expect(result.symbol).toBe('MATIC');
    });
  });

  describe('validateAddress', () => {
    it('should validate correct ethereum address', () => {
      const result = service.validateAddress({
        address: '0x1234567890123456789012345678901234567890',
        network: 'ethereum',
      });

      expect(result).toBe(true);
    });

    it('should reject address without 0x prefix on ethereum', () => {
      const result = service.validateAddress({
        address: '1234567890123456789012345678901234567890',
        network: 'ethereum',
      });

      expect(result).toBe(false);
    });

    it('should reject address with wrong length', () => {
      const result = service.validateAddress({
        address: '0x1234',
        network: 'ethereum',
      });

      expect(result).toBe(false);
    });

    it('should validate polygon address', () => {
      const result = service.validateAddress({
        address: '0x1234567890123456789012345678901234567890',
        network: 'polygon',
      });

      expect(result).toBe(true);
    });

    it('should validate bsc address', () => {
      const result = service.validateAddress({
        address: '0x1234567890123456789012345678901234567890',
        network: 'bsc',
      });

      expect(result).toBe(true);
    });

    it('should return false for null address', () => {
      const result = service.validateAddress({
        address: null as any,
        network: 'ethereum',
      });

      expect(result).toBe(false);
    });

    it('should return false for undefined address', () => {
      const result = service.validateAddress({
        address: undefined as any,
        network: 'ethereum',
      });

      expect(result).toBe(false);
    });

    it('should return false for empty string address', () => {
      const result = service.validateAddress({
        address: '',
        network: 'ethereum',
      });

      expect(result).toBe(false);
    });
  });

  describe('getNetworkInfo', () => {
    it('should return ethereum network info', () => {
      const info = service.getNetworkInfo('ethereum');

      expect(info.name).toBe('Ethereum Mainnet');
      expect(info.chainId).toBe(1);
      expect(info.symbol).toBe('ETH');
    });

    it('should return sepolia network info', () => {
      const info = service.getNetworkInfo('sepolia');

      expect(info.name).toBe('Ethereum Sepolia Testnet');
      expect(info.chainId).toBe(11155111);
    });

    it('should return polygon network info', () => {
      const info = service.getNetworkInfo('polygon');

      expect(info.name).toBe('Polygon Mainnet');
      expect(info.chainId).toBe(137);
      expect(info.symbol).toBe('MATIC');
    });

    it('should return mumbai network info', () => {
      const info = service.getNetworkInfo('mumbai');

      expect(info.name).toBe('Polygon Mumbai Testnet');
    });

    it('should return bsc network info', () => {
      const info = service.getNetworkInfo('bsc');

      expect(info.name).toBe('BNB Smart Chain');
      expect(info.chainId).toBe(56);
      expect(info.symbol).toBe('BNB');
    });

    it('should default to ethereum for unknown network', () => {
      const info = service.getNetworkInfo('unknown');

      expect(info.name).toBe('Ethereum Mainnet');
    });
  });

  describe('signMessage', () => {
    it('should sign a message with private key', () => {
      const result = service.signMessage('Hello World', 'a'.repeat(64));

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
      expect(result.signature.length).toBe(64);
      expect(result.message).toBe('Hello World');
    });

    it('should throw error for empty message', () => {
      expect(() => service.signMessage('', 'a'.repeat(64))).toThrow(
        'Message cannot be empty',
      );
    });

    it('should throw error for invalid private key format', () => {
      expect(() => service.signMessage('Hello', 'short')).toThrow(
        'Invalid private key format',
      );
    });

    it('should generate different signatures for different messages', () => {
      const sig1 = service.signMessage('Message 1', 'a'.repeat(64));
      const sig2 = service.signMessage('Message 2', 'a'.repeat(64));

      expect(sig1.signature).not.toEqual(sig2.signature);
    });

    it('should generate different signatures for different keys', () => {
      const sig1 = service.signMessage('Same Message', 'a'.repeat(64));
      const sig2 = service.signMessage('Same Message', 'b'.repeat(64));

      expect(sig1.signature).not.toEqual(sig2.signature);
    });
  });

  describe('verifySignature', () => {
    it('should return boolean result for valid signature', () => {
      const { signature, message } = service.signMessage(
        'Hello World',
        'a'.repeat(64),
      );
      const address = service.generateWallet().address;

      const result = service.verifySignature(message, signature, address);

      expect(typeof result).toBe('boolean');
    });

    it('should return false for tampered message', () => {
      const { signature } = service.signMessage('Original', 'a'.repeat(64));

      const result = service.verifySignature('Tampered', signature, '0x1234');

      expect(result).toBe(false);
    });

    it('should return false for empty parameters', () => {
      expect(service.verifySignature('', '', '')).toBe(false);
      expect(service.verifySignature('msg', '', 'addr')).toBe(false);
      expect(service.verifySignature('msg', 'sig', '')).toBe(false);
    });
  });

  describe('estimateGas', () => {
    it('should return gas estimation', async () => {
      const result = await service.estimateGas(
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
        1,
        'ethereum',
      );

      expect(result).toBeDefined();
      expect(result.gasLimit).toBe(21000);
      expect(result.gasPrice).toBeDefined();
      expect(result.estimatedCost).toBeDefined();
    });

    it('should estimate gas for polygon', async () => {
      const result = await service.estimateGas(
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
        1,
        'polygon',
      );

      expect(result.gasLimit).toBe(21000);
    });
  });

  describe('getTransactionReceipt', () => {
    it('should return transaction receipt for valid hash', async () => {
      const txHash = '0x' + 'a'.repeat(64);
      const result = await service.getTransactionReceipt(txHash, 'ethereum');

      expect(result).toBeDefined();
      expect(result?.hash).toBe(txHash);
      expect(result?.status).toBe('confirmed');
      expect(result?.network).toBe('Ethereum Mainnet');
    });

    it('should return null for invalid hash', async () => {
      const result = await service.getTransactionReceipt('invalid', 'ethereum');

      expect(result).toBeNull();
    });

    it('should return null for hash with wrong length', async () => {
      const result = await service.getTransactionReceipt('0x1234', 'ethereum');

      expect(result).toBeNull();
    });
  });

  describe('convertAddress', () => {
    it('should convert hex to base58', () => {
      const result = service.convertAddress(
        '0x1234567890abcdef',
        'hex',
        'base58',
      );

      expect(result).toBeDefined();
      expect(result.converted).toBeDefined();
      expect(result.fromFormat).toBe('hex');
      expect(result.toFormat).toBe('base58');
    });

    it('should convert base58 to hex', () => {
      const result = service.convertAddress('12345', 'base58', 'hex');

      expect(result).toBeDefined();
      expect(result.fromFormat).toBe('base58');
      expect(result.toFormat).toBe('hex');
    });

    it('should throw error for empty address', () => {
      expect(() => service.convertAddress('', 'hex', 'base58')).toThrow(
        'Address cannot be empty',
      );
    });
  });
});
