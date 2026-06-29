import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

describe('BlockchainController', () => {
  let controller: BlockchainController;
  let service: jest.Mocked<BlockchainService>;

  beforeEach(async () => {
    const mockBlockchainService = {
      generateWallet: jest.fn(),
      createTransaction: jest.fn(),
      getBalance: jest.fn(),
      validateAddress: jest.fn(),
      getNetworkInfo: jest.fn(),
      signMessage: jest.fn(),
      verifySignature: jest.fn(),
      estimateGas: jest.fn(),
      getTransactionReceipt: jest.fn(),
      convertAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockchainController],
      providers: [
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
      ],
    }).compile();

    controller = module.get<BlockchainController>(BlockchainController);
    service = module.get(BlockchainService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateWallet', () => {
    it('should call service.generateWallet with default network', () => {
      const mockWallet = {
        address: '0x1234',
        privateKey: '5678',
        publicKey: 'abcd',
        network: 'Ethereum Mainnet',
      };
      service.generateWallet.mockReturnValue(mockWallet);

      const result = controller.generateWallet({});

      expect(result).toEqual(mockWallet);
      expect(service.generateWallet).toHaveBeenCalledWith(undefined);
    });

    it('should call service.generateWallet with specified network', () => {
      const mockWallet = {
        address: '0x1234',
        privateKey: '5678',
        publicKey: 'abcd',
        network: 'Polygon Mainnet',
      };
      service.generateWallet.mockReturnValue(mockWallet);

      const result = controller.generateWallet({ network: 'polygon' });

      expect(result).toEqual(mockWallet);
      expect(service.generateWallet).toHaveBeenCalledWith('polygon');
    });
  });

  describe('createTransaction', () => {
    it('should call service.createTransaction with correct parameters', () => {
      const mockTx = {
        fromAddress: '0x1234',
        toAddress: '0x5678',
        amount: 1,
        hash: 'txhash',
        signature: 'sig',
        timestamp: 123456,
        network: 'Ethereum Mainnet',
      };
      service.createTransaction.mockReturnValue(mockTx);

      const result = controller.createTransaction({
        fromAddress: '0x1234',
        toAddress: '0x5678',
        amount: 1,
        privateKey: 'key',
        network: 'ethereum',
      });

      expect(result).toEqual(mockTx);
      expect(service.createTransaction).toHaveBeenCalledWith(
        '0x1234',
        '0x5678',
        1,
        'key',
        'ethereum',
      );
    });
  });

  describe('getBalance', () => {
    it('should call service.getBalance with correct parameters', async () => {
      const mockBalance = {
        balance: '1.5',
        network: 'Ethereum Mainnet',
        symbol: 'ETH',
      };
      service.getBalance.mockResolvedValue(mockBalance);

      const result = await controller.getBalance({
        address: '0x1234',
        network: 'ethereum',
      });

      expect(result).toEqual(mockBalance);
      expect(service.getBalance).toHaveBeenCalledWith('0x1234', 'ethereum');
    });
  });

  describe('validateAddress', () => {
    it('should call service.validateAddress with correct parameters', () => {
      service.validateAddress.mockReturnValue(true);

      const result = controller.validateAddress({
        address: '0x1234',
        network: 'ethereum',
      });

      expect(result).toBe(true);
      expect(service.validateAddress).toHaveBeenCalledWith({
        address: '0x1234',
        network: 'ethereum',
      });
    });
  });

  describe('getNetworkInfo', () => {
    it('should call service.getNetworkInfo with correct parameters', () => {
      const mockInfo = {
        name: 'Ethereum Mainnet',
        chainId: 1,
        rpcUrl: 'url',
        explorerUrl: 'exp',
        symbol: 'ETH',
      };
      service.getNetworkInfo.mockReturnValue(mockInfo);

      const result = controller.getNetworkInfo({ network: 'ethereum' });

      expect(result).toEqual(mockInfo);
      expect(service.getNetworkInfo).toHaveBeenCalledWith('ethereum');
    });
  });

  describe('signMessage', () => {
    it('should call service.signMessage with correct parameters', () => {
      const mockResult = { signature: 'sig', message: 'msg' };
      service.signMessage.mockReturnValue(mockResult);

      const result = controller.signMessage({
        message: 'msg',
        privateKey: 'key',
      });

      expect(result).toEqual(mockResult);
      expect(service.signMessage).toHaveBeenCalledWith('msg', 'key');
    });
  });

  describe('verifySignature', () => {
    it('should call service.verifySignature with correct parameters', () => {
      service.verifySignature.mockReturnValue(true);

      const result = controller.verifySignature({
        message: 'msg',
        signature: 'sig',
        address: '0x1234',
      });

      expect(result).toBe(true);
      expect(service.verifySignature).toHaveBeenCalledWith(
        'msg',
        'sig',
        '0x1234',
      );
    });
  });

  describe('estimateGas', () => {
    it('should call service.estimateGas with correct parameters', async () => {
      const mockResult = {
        gasLimit: 21000,
        gasPrice: '0.02',
        estimatedCost: '0.00042',
      };
      service.estimateGas.mockResolvedValue(mockResult);

      const result = await controller.estimateGas({
        fromAddress: '0x1234',
        toAddress: '0x5678',
        amount: 1,
        network: 'ethereum',
      });

      expect(result).toEqual(mockResult);
      expect(service.estimateGas).toHaveBeenCalledWith(
        '0x1234',
        '0x5678',
        1,
        'ethereum',
      );
    });
  });

  describe('getTransactionReceipt', () => {
    it('should call service.getTransactionReceipt with correct parameters', async () => {
      const mockReceipt = {
        hash: '0x1234',
        status: 'confirmed',
        blockNumber: 12345,
        network: 'Ethereum',
        confirmations: 10,
      };
      service.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await controller.getTransactionReceipt({
        txHash: '0x1234',
        network: 'ethereum',
      });

      expect(result).toEqual(mockReceipt);
      expect(service.getTransactionReceipt).toHaveBeenCalledWith(
        '0x1234',
        'ethereum',
      );
    });
  });

  describe('convertAddress', () => {
    it('should call service.convertAddress with correct parameters', () => {
      const mockResult = {
        original: '0x1234',
        converted: 'base58value',
        fromFormat: 'hex',
        toFormat: 'base58',
      };
      service.convertAddress.mockReturnValue(mockResult);

      const result = controller.convertAddress({
        address: '0x1234',
        from: 'hex',
        to: 'base58',
      });

      expect(result).toEqual(mockResult);
      expect(service.convertAddress).toHaveBeenCalledWith(
        '0x1234',
        'hex',
        'base58',
      );
    });
  });
});
