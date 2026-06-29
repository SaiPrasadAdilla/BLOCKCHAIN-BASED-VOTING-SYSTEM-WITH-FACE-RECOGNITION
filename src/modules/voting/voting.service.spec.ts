import { Test, TestingModule } from '@nestjs/testing';
import { VotingService } from './voting.service';
import { FacialRecognitionService } from '../facial-recognition/facial-recognition.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { getModelToken } from '@nestjs/mongoose';
import { Voter, Election, Vote, Candidate } from '../../schemas/voting.schema';

describe('VotingService', () => {
  let service: VotingService;
  let mockVoterModel: any;
  let mockElectionModel: any;
  let mockVoteModel: any;
  let mockCandidateModel: any;
  let mockFacialRecognitionService: any;
  let mockBlockchainService: any;

  beforeEach(async () => {
    mockVoterModel = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    mockElectionModel = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    mockVoteModel = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    mockCandidateModel = {
      find: jest.fn(),
      updateOne: jest.fn(),
    };
    mockFacialRecognitionService = {
      registerUserFace: jest.fn(),
      verifyUserFace: jest.fn(),
    };
    mockBlockchainService = {
      generateWallet: jest.fn().mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        privateKey:
          '1234567890123456789012345678901234567890123456789012345678901234',
      }),
      createTransaction: jest.fn().mockReturnValue({
        hash: '0xabcdef123456789',
        timestamp: Date.now(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotingService,
        { provide: getModelToken(Voter.name), useValue: mockVoterModel },
        { provide: getModelToken(Election.name), useValue: mockElectionModel },
        { provide: getModelToken(Vote.name), useValue: mockVoteModel },
        {
          provide: getModelToken(Candidate.name),
          useValue: mockCandidateModel,
        },
        {
          provide: FacialRecognitionService,
          useValue: mockFacialRecognitionService,
        },
        { provide: BlockchainService, useValue: mockBlockchainService },
      ],
    }).compile();

    service = module.get<VotingService>(VotingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerVoter', () => {
    it('should fail if voter already registered', async () => {
      mockVoterModel.findOne.mockResolvedValue({
        voterId: 'VTR-123-ABC',
        userId: 'user123',
      });

      const mockFile = {
        originalname: 'face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('data'),
      } as any;

      const result = await service.registerVoter({
        userId: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        faceImage: mockFile,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Voter already registered');
    });
  });

  describe('approveVoter', () => {
    it('should successfully approve a voter', async () => {
      const mockVoter = {
        voterId: 'VTR-123-ABC',
        status: 'pending',
        save: jest.fn(),
      };
      mockVoterModel.findOne.mockResolvedValue(mockVoter);

      const result = await service.approveVoter('VTR-123-ABC', 'admin');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('approved');
      expect(mockVoter.save).toHaveBeenCalled();
    });

    it('should fail if voter not found', async () => {
      mockVoterModel.findOne.mockResolvedValue(null);

      const result = await service.approveVoter('VTR-123-ABC', 'admin');

      expect(result.success).toBe(false);
    });

    it('should fail if voter not in pending status', async () => {
      mockVoterModel.findOne.mockResolvedValue({
        voterId: 'VTR-123-ABC',
        status: 'approved',
      });

      const result = await service.approveVoter('VTR-123-ABC', 'admin');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Voter is not in pending status');
    });
  });

  describe('rejectVoter', () => {
    it('should successfully reject a voter', async () => {
      const mockVoter = {
        voterId: 'VTR-123-ABC',
        status: 'pending',
        save: jest.fn(),
      };
      mockVoterModel.findOne.mockResolvedValue(mockVoter);

      const result = await service.rejectVoter('VTR-123-ABC', 'admin');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('rejected');
    });

    it('should fail if voter not found', async () => {
      mockVoterModel.findOne.mockResolvedValue(null);

      const result = await service.rejectVoter('VTR-123-ABC', 'admin');

      expect(result.success).toBe(false);
    });
  });

  describe('getVoter', () => {
    it('should return voter by ID', async () => {
      const mockVoter = { voterId: 'VTR-123-ABC', name: 'John Doe' };
      mockVoterModel.findOne.mockResolvedValue(mockVoter);

      const result = await service.getVoter('VTR-123-ABC');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVoter);
    });

    it('should fail if voter not found', async () => {
      mockVoterModel.findOne.mockResolvedValue(null);

      const result = await service.getVoter('VTR-123-ABC');

      expect(result.success).toBe(false);
    });
  });

  describe('getVotersByStatus', () => {
    it('should return voters by status', async () => {
      const mockVoters = [{ voterId: 'VTR-123-ABC', status: 'pending' }];
      mockVoterModel.find.mockResolvedValue(mockVoters);

      const result = await service.getVotersByStatus('pending');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVoters);
    });
  });

  describe('activateElection', () => {
    it('should fail if election not found', async () => {
      mockElectionModel.findOne.mockResolvedValue(null);

      const result = await service.activateElection('ELEC-123-ABC');

      expect(result.success).toBe(false);
    });

    it('should fail if election not in scheduled status', async () => {
      mockElectionModel.findOne.mockResolvedValue({
        electionId: 'ELEC-123-ABC',
        status: 'active',
      });

      const result = await service.activateElection('ELEC-123-ABC');

      expect(result.success).toBe(false);
    });
  });

  describe('getElection', () => {
    it('should fail if election not found', async () => {
      mockElectionModel.findOne.mockResolvedValue(null);

      const result = await service.getElection('ELEC-123-ABC');

      expect(result.success).toBe(false);
    });
  });

  describe('getActiveElections', () => {
    it('should return active elections', async () => {
      const mockElections = [{ electionId: 'ELEC-123-ABC', status: 'active' }];
      mockElectionModel.find.mockResolvedValue(mockElections);

      const result = await service.getActiveElections();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockElections);
    });
  });

  describe('castVote', () => {
    it('should fail if election not active', async () => {
      mockElectionModel.findOne.mockResolvedValue({
        electionId: 'ELEC-123-ABC',
        status: 'completed',
      });

      const mockFile = {
        originalname: 'face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('data'),
      } as any;

      const result = await service.castVote({
        electionId: 'ELEC-123-ABC',
        voterId: 'VTR-123-ABC',
        candidateId: 'CAND-123-ABC',
        faceImage: mockFile,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Election is not active');
    });

    it('should fail if voter not eligible', async () => {
      mockElectionModel.findOne.mockResolvedValue({
        electionId: 'ELEC-123-ABC',
        status: 'active',
        eligibleVoterIds: [],
      });

      const mockFile = {
        originalname: 'face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('data'),
      } as any;

      const result = await service.castVote({
        electionId: 'ELEC-123-ABC',
        voterId: 'VTR-123-ABC',
        candidateId: 'CAND-123-ABC',
        faceImage: mockFile,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Voter is not eligible for this election');
    });

    it('should fail if vote already cast', async () => {
      mockElectionModel.findOne.mockResolvedValue({
        electionId: 'ELEC-123-ABC',
        status: 'active',
        eligibleVoterIds: ['VTR-123-ABC'],
      });
      mockVoteModel.findOne.mockResolvedValue({ voteId: 'VOTE-123-ABC' });

      const mockFile = {
        originalname: 'face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('data'),
      } as any;

      const result = await service.castVote({
        electionId: 'ELEC-123-ABC',
        voterId: 'VTR-123-ABC',
        candidateId: 'CAND-123-ABC',
        faceImage: mockFile,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Vote already cast');
    });
  });

  describe('getVoteResults', () => {
    it('should return vote results for an election', async () => {
      mockElectionModel.findOne.mockResolvedValue({
        electionId: 'ELEC-123-ABC',
        title: 'Test Election',
      });
      mockCandidateModel.find.mockResolvedValue([
        { candidateId: 'CAND-123-ABC', name: 'Candidate 1', party: 'Party A' },
      ]);
      mockVoteModel.find.mockResolvedValue([{ candidateId: 'CAND-123-ABC' }]);

      const result = await service.getVoteResults('ELEC-123-ABC');

      expect(result.success).toBe(true);
      expect(result.data.totalVotes).toBe(1);
    });
  });

  describe('getVoterVotes', () => {
    it('should return votes for a voter', async () => {
      const mockVotes = [
        { voteId: 'VOTE-123-ABC', electionId: 'ELEC-123-ABC' },
      ];
      mockVoteModel.find.mockResolvedValue(mockVotes);

      const result = await service.getVoterVotes('VTR-123-ABC');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVotes);
    });
  });

  describe('getBlockchainVoteRecord', () => {
    it('should return blockchain record for a vote', async () => {
      const mockVote = {
        voteId: 'VOTE-123-ABC',
        blockchainVoteData: { txHash: '0xabc123', timestamp: new Date() },
      };
      mockVoteModel.findOne.mockResolvedValue(mockVote);

      const result = await service.getBlockchainVoteRecord('VOTE-123-ABC');

      expect(result.success).toBe(true);
      expect(result.data.txHash).toBe('0xabc123');
    });

    it('should fail if vote not found', async () => {
      mockVoteModel.findOne.mockResolvedValue(null);

      const result = await service.getBlockchainVoteRecord('VOTE-123-ABC');

      expect(result.success).toBe(false);
    });
  });
});
