import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Voter,
  Election,
  Vote,
  Candidate,
  VoterDocument,
  ElectionDocument,
  VoteDocument,
  CandidateDocument,
} from '../../schemas/voting.schema';
import { FacialRecognitionService } from '../facial-recognition/facial-recognition.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface RegisterVoterRequest {
  name: string;
  email: string;
  faceImage: Express.Multer.File;
  documents?: Express.Multer.File[];
}

export interface VoterResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ElectionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface CastVoteRequest {
  electionId: string;
  voterId: string;
  candidateId: string;
  faceImage: Express.Multer.File;
}

@Injectable()
export class VotingService {
  private readonly logger = new Logger(VotingService.name);
  private readonly assetsFolder: string;
  private readonly documentsFolder: string;

  constructor(
    @InjectModel(Voter.name) private voterModel: Model<VoterDocument>,
    @InjectModel(Election.name) private electionModel: Model<ElectionDocument>,
    @InjectModel(Vote.name) private voteModel: Model<VoteDocument>,
    @InjectModel(Candidate.name)
    private candidateModel: Model<CandidateDocument>,
    @Inject(forwardRef(() => FacialRecognitionService))
    private facialRecognitionService: FacialRecognitionService,
    private blockchainService: BlockchainService,
  ) {
    this.assetsFolder = path.join(process.cwd(), 'assets', 'voters', 'faces');
    this.documentsFolder = path.join(
      process.cwd(),
      'assets',
      'voters',
      'documents',
    );
    this.ensureFolders();
  }

  private ensureFolders(): void {
    [this.assetsFolder, this.documentsFolder].forEach((folder) => {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
    });
  }

  async registerVoter(request: RegisterVoterRequest): Promise<VoterResponse> {
    this.logger.log(
      `[REGISTER_VOTER] Starting registration for: ${request.name}`,
    );

    try {
      const userId = this.generateUserId();
      this.logger.log(`[REGISTER_VOTER] Generated userId: ${userId}`);

      this.logger.log(
        `[REGISTER_VOTER] Checking for existing voter with userId: ${userId}`,
      );
      const existingVoter = await this.voterModel.findOne({ userId });
      if (existingVoter) {
        this.logger.warn(
          `[REGISTER_VOTER] Voter already exists for userId: ${userId}`,
        );
        return {
          success: false,
          message: 'Voter already registered',
          error: 'User already has a voter registration',
        };
      }

      const voterId = this.generateVoterId();
      this.logger.log(`[REGISTER_VOTER] Generated voterId: ${voterId}`);

      let faceImagePath = '';
      if (request.faceImage) {
        this.logger.log(
          `[REGISTER_VOTER] Saving face image for voterId: ${voterId}`,
        );
        faceImagePath = await this.saveFaceImage(request.faceImage, voterId);
        this.logger.log(
          `[REGISTER_VOTER] Face image saved at: ${faceImagePath}`,
        );

        this.logger.log(
          `[REGISTER_VOTER] Checking for duplicate face in existing registrations`,
        );
        const duplicateCheck =
          await this.facialRecognitionService.checkFaceDuplicate(
            request.faceImage,
          );
        if (duplicateCheck.isDuplicate) {
          this.logger.warn(
            `[REGISTER_VOTER] Duplicate face detected, rejecting registration`,
          );
          if (fs.existsSync(path.join(process.cwd(), faceImagePath))) {
            await fs.promises.unlink(path.join(process.cwd(), faceImagePath));
          }
          return {
            success: false,
            message:
              'Registration rejected: A voter with this face is already registered',
            error: 'Duplicate face detected',
          };
        }
        this.logger.log(
          `[REGISTER_VOTER] No duplicate face found, proceeding with registration`,
        );
      }

      const documentPaths: string[] = [];
      if (request.documents && request.documents.length > 0) {
        this.logger.log(
          `[REGISTER_VOTER] Saving ${request.documents.length} documents for voterId: ${voterId}`,
        );
        for (const doc of request.documents) {
          const docPath = await this.saveDocument(doc, voterId);
          documentPaths.push(docPath);
        }
        this.logger.log(
          `[REGISTER_VOTER] Documents saved: ${documentPaths.length} files`,
        );
      }

      this.logger.log(`[REGISTER_VOTER] Creating voter record in MongoDB`);
      const voter = new this.voterModel({
        voterId,
        userId,
        name: request.name,
        email: request.email,
        faceImagePath,
        documentPaths,
        status: 'pending',
      });
      await voter.save();
      this.logger.log(
        `[REGISTER_VOTER] Voter record created in MongoDB with status: pending`,
      );

      this.logger.log(`[REGISTER_VOTER] Registering voter on blockchain`);
      const blockchainData = await this.blockchainService.registerVoter({
        voterId: voter.voterId,
        userId: voter.userId,
        name: voter.name,
        email: voter.email,
        registeredAt: new Date(),
        status: voter.status,
      });
      voter.blockchainRegistration = blockchainData;
      voter.blockchainTxHash = blockchainData.txHash;
      await voter.save();
      this.logger.log(
        `[REGISTER_VOTER] Voter registered on blockchain, txHash: ${blockchainData.txHash}`,
      );

      this.logger.log(
        `[REGISTER_VOTER] Registering face with facial recognition service`,
      );
      const registerResult =
        await this.facialRecognitionService.registerUserFace(
          voterId,
          request.faceImage,
        );
      this.logger.log(
        `[REGISTER_VOTER] Face registration result: ${registerResult.success ? 'SUCCESS' : 'FAILED'}`,
      );

      this.logger.log(
        `[REGISTER_VOTER] Voter registration completed successfully for voterId: ${voterId}`,
      );
      return {
        success: true,
        message: 'Voter registered successfully',
        data: {
          voterId: voter.voterId,
          userId: voter.userId,
          name: voter.name,
          email: voter.email,
          faceImagePath: voter.faceImagePath,
          documentPaths: voter.documentPaths,
          status: voter.status,
          blockchainTxHash: voter.blockchainTxHash,
        },
      };
    } catch (error) {
      this.logger.error(
        `[REGISTER_VOTER] Error registering voter: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to register voter',
        error: error.message,
      };
    }
  }

  async approveVoter(
    voterId: string,
    approvedBy: string,
  ): Promise<VoterResponse> {
    this.logger.log(`Approving voter: ${voterId}`);

    try {
      const voter = await this.voterModel.findOne({ voterId });
      if (!voter) {
        throw new NotFoundException('Voter not found');
      }

      if (voter.status !== 'pending') {
        return {
          success: false,
          message: 'Voter is not in pending status',
          error: 'Cannot approve voter with current status',
        };
      }

      voter.status = 'approved';
      voter.approvedBy = approvedBy;
      voter.assignedAt = new Date();
      await voter.save();

      return {
        success: true,
        message: 'Voter approved successfully',
        data: {
          voterId: voter.voterId,
          status: voter.status,
          assignedAt: voter.assignedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Error approving voter: ${error.message}`);
      return {
        success: false,
        message: 'Failed to approve voter',
        error: error.message,
      };
    }
  }

  async rejectVoter(
    voterId: string,
    rejectedBy: string,
  ): Promise<VoterResponse> {
    this.logger.log(`Rejecting voter: ${voterId}`);

    try {
      const voter = await this.voterModel.findOne({ voterId });
      if (!voter) {
        throw new NotFoundException('Voter not found');
      }

      voter.status = 'rejected';
      voter.approvedBy = rejectedBy;
      await voter.save();

      return {
        success: true,
        message: 'Voter rejected successfully',
        data: {
          voterId: voter.voterId,
          status: voter.status,
        },
      };
    } catch (error) {
      this.logger.error(`Error rejecting voter: ${error.message}`);
      return {
        success: false,
        message: 'Failed to reject voter',
        error: error.message,
      };
    }
  }

  async getVoter(voterId: string): Promise<VoterResponse> {
    try {
      const voter = await this.voterModel.findOne({ voterId });
      if (!voter) {
        throw new NotFoundException('Voter not found');
      }

      return {
        success: true,
        message: 'Voter retrieved successfully',
        data: voter,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve voter',
        error: error.message,
      };
    }
  }

  async getVotersByStatus(status: string): Promise<VoterResponse> {
    try {
      const voters = await this.voterModel.find({ status });
      return {
        success: true,
        message: 'Voters retrieved successfully',
        data: voters,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve voters',
        error: error.message,
      };
    }
  }

  async createElection(data: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    candidateIds: string[];
    createdBy: string;
  }): Promise<ElectionResponse> {
    this.logger.log(
      `[CREATE_ELECTION] Starting election creation: ${data.title}`,
    );

    try {
      this.logger.log(`[CREATE_ELECTION] Generating election ID`);
      const electionId = this.generateElectionId();
      this.logger.log(`[CREATE_ELECTION] Generated electionId: ${electionId}`);

      this.logger.log(
        `[CREATE_ELECTION] Fetching candidate details for ${data.candidateIds.length} candidates`,
      );
      const candidates = await this.candidateModel.find({
        candidateId: { $in: data.candidateIds },
      });

      if (candidates.length !== data.candidateIds.length) {
        throw new BadRequestException('One or more candidate IDs are invalid');
      }

      const candidateData = candidates.map((c) => ({
        candidateId: c.candidateId,
        name: c.name,
        party: c.party,
        description: c.description || '',
      }));

      this.logger.log(`[CREATE_ELECTION] Creating election record in MongoDB`);
      const election = new this.electionModel({
        electionId,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'scheduled',
        candidates: candidateData,
        eligibleVoterIds: [],
        createdBy: data.createdBy,
      });
      await election.save();
      this.logger.log(
        `[CREATE_ELECTION] Election record created with status: scheduled`,
      );

      this.logger.log(`[CREATE_ELECTION] Creating election on blockchain`);
      const blockchainData = await this.blockchainService.createElection({
        electionId: election.electionId,
        title: election.title,
        description: election.description,
        startDate: election.startDate,
        endDate: election.endDate,
        createdBy: election.createdBy || '',
        candidates: candidateData.map((c) => c.name),
      });
      election.blockchainElectionData = blockchainData;
      election.blockchainTxHash = blockchainData.txHash;
      await election.save();
      this.logger.log(
        `[CREATE_ELECTION] Election created on blockchain, txHash: ${blockchainData.txHash}`,
      );

      this.logger.log(
        `[CREATE_ELECTION] Election creation completed for: ${electionId}`,
      );
      return {
        success: true,
        message: 'Election created successfully',
        data: {
          electionId: election.electionId,
          title: election.title,
          status: election.status,
          startDate: election.startDate,
          endDate: election.endDate,
          blockchainTxHash: election.blockchainTxHash,
          candidates: candidateData.map((c) => c.name),
        },
      };
    } catch (error) {
      this.logger.error(
        `[CREATE_ELECTION] Error creating election: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to create election',
        error: error.message,
      };
    }
  }

  async activateElection(electionId: string): Promise<ElectionResponse> {
    this.logger.log(
      `[ACTIVATE_ELECTION] Starting activation for election: ${electionId}`,
    );

    try {
      this.logger.log(`[ACTIVATE_ELECTION] Fetching election from MongoDB`);
      const election = await this.electionModel.findOne({ electionId });
      if (!election) {
        this.logger.warn(
          `[ACTIVATE_ELECTION] Election not found: ${electionId}`,
        );
        throw new NotFoundException('Election not found');
      }
      this.logger.log(
        `[ACTIVATE_ELECTION] Election fetched, current status: ${election.status}`,
      );

      if (election.status !== 'scheduled') {
        this.logger.warn(
          `[ACTIVATE_ELECTION] Cannot activate - election status is: ${election.status}`,
        );
        return {
          success: false,
          message: 'Election cannot be activated',
          error: 'Invalid election status',
        };
      }

      this.logger.log(`[ACTIVATE_ELECTION] Fetching approved voters`);
      const eligibleVoters = await this.voterModel
        .find({ status: 'approved' })
        .select('voterId');
      election.eligibleVoterIds = eligibleVoters.map((v) => v.voterId);
      election.status = 'active';
      await election.save();
      this.logger.log(
        `[ACTIVATE_ELECTION] Election activated with ${eligibleVoters.length} eligible voters`,
      );

      this.logger.log(
        `[ACTIVATE_ELECTION] Election activation completed for: ${electionId}`,
      );
      return {
        success: true,
        message: 'Election activated successfully',
        data: {
          electionId: election.electionId,
          status: election.status,
          eligibleVoters: election.eligibleVoterIds.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `[ACTIVATE_ELECTION] Error activating election: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to activate election',
        error: error.message,
      };
    }
  }

  async stopElection(electionId: string): Promise<ElectionResponse> {
    this.logger.log(
      `[STOP_ELECTION] Starting stop for election: ${electionId}`,
    );

    try {
      const election = await this.electionModel.findOne({ electionId });
      if (!election) {
        throw new NotFoundException('Election not found');
      }

      if (election.status !== 'active') {
        return {
          success: false,
          message: 'Election cannot be stopped',
          error: 'Only active elections can be stopped',
        };
      }

      election.status = 'completed';
      await election.save();

      this.logger.log(`[STOP_ELECTION] Election stopped: ${electionId}`);
      return {
        success: true,
        message: 'Election stopped successfully',
        data: {
          electionId: election.electionId,
          status: election.status,
        },
      };
    } catch (error) {
      this.logger.error(
        `[STOP_ELECTION] Error stopping election: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to stop election',
        error: error.message,
      };
    }
  }

  async getElection(electionId: string): Promise<ElectionResponse> {
    try {
      const election = await this.electionModel.findOne({ electionId });
      if (!election) {
        throw new NotFoundException('Election not found');
      }

      return {
        success: true,
        message: 'Election retrieved successfully',
        data: election.toObject(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve election',
        error: error.message,
      };
    }
  }

  async getActiveElections(): Promise<ElectionResponse> {
    try {
      const elections = await this.electionModel.find({ status: 'active' });
      return {
        success: true,
        message: 'Active elections retrieved successfully',
        data: elections,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve elections',
        error: error.message,
      };
    }
  }

  async getAllElections(): Promise<ElectionResponse> {
    try {
      const elections = await this.electionModel.find().sort({ createdAt: -1 });
      return {
        success: true,
        message: 'All elections retrieved successfully',
        data: elections,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve elections',
        error: error.message,
      };
    }
  }

  async castVote(request: CastVoteRequest): Promise<VoterResponse> {
    this.logger.log(
      `[CAST_VOTE] Starting vote cast - election: ${request.electionId}, voter: ${request.voterId}, candidate: ${request.candidateId}`,
    );

    try {
      this.logger.log(`[CAST_VOTE] Fetching election: ${request.electionId}`);
      const election = await this.electionModel.findOne({
        electionId: request.electionId,
      });
      if (!election) {
        this.logger.warn(
          `[CAST_VOTE] Election not found: ${request.electionId}`,
        );
        throw new NotFoundException('Election not found');
      }
      this.logger.log(
        `[CAST_VOTE] Election fetched, status: ${election.status}`,
      );

      if (election.status !== 'active') {
        this.logger.warn(
          `[CAST_VOTE] Election is not active, current status: ${election.status}`,
        );
        return {
          success: false,
          message: 'Election is not active',
          error: 'Cannot cast vote at this time',
        };
      }

      this.logger.log(
        `[CAST_VOTE] Checking voter eligibility: ${request.voterId}`,
      );
      if (!election.eligibleVoterIds.includes(request.voterId)) {
        this.logger.warn(
          `[CAST_VOTE] Voter not eligible for this election: ${request.voterId}`,
        );
        return {
          success: false,
          message: 'Voter is not eligible for this election',
          error: 'Voter not authorized',
        };
      }
      this.logger.log(`[CAST_VOTE] Voter is eligible`);

      this.logger.log(
        `[CAST_VOTE] Validating candidate: ${request.candidateId}`,
      );
      const candidate = await this.candidateModel.findOne({
        candidateId: request.candidateId,
      });
      if (!candidate) {
        this.logger.warn(
          `[CAST_VOTE] Candidate not found: ${request.candidateId}`,
        );
        return {
          success: false,
          message: 'Invalid candidate',
          error: 'Candidate not found in this election',
        };
      }
      this.logger.log(`[CAST_VOTE] Candidate validated: ${candidate.name}`);

      this.logger.log(`[CAST_VOTE] Checking for existing vote`);
      const existingVote = await this.voteModel.findOne({
        electionId: request.electionId,
        voterId: request.voterId,
      });
      if (existingVote) {
        this.logger.warn(
          `[CAST_VOTE] Vote already cast by voter: ${request.voterId}`,
        );
        return {
          success: false,
          message: 'Vote already cast',
          error: 'Voter has already voted in this election',
        };
      }
      this.logger.log(`[CAST_VOTE] No existing vote found`);

      this.logger.log(`[CAST_VOTE] Fetching voter: ${request.voterId}`);
      const voter = await this.voterModel.findOne({ voterId: request.voterId });
      if (!voter || voter.status !== 'approved') {
        this.logger.warn(
          `[CAST_VOTE] Voter not found or not approved: ${request.voterId}, status: ${voter?.status}`,
        );
        return {
          success: false,
          message: 'Voter not found or not approved',
          error: 'Invalid voter',
        };
      }
      this.logger.log(`[CAST_VOTE] Voter fetched, voterId: ${voter.voterId}`);

      this.logger.log(
        `[CAST_VOTE] Starting face verification for voter: ${voter.voterId}`,
      );
      const verificationResult =
        await this.facialRecognitionService.verifyUserFace(
          voter.voterId,
          request.faceImage,
        );
      this.logger.log(
        `[CAST_VOTE] Face verification completed - success: ${verificationResult.success}, similarity: ${verificationResult.similarity}`,
      );

      const matchThreshold = 0.45;

      if (
        !verificationResult.success ||
        verificationResult.similarity < matchThreshold
      ) {
        this.logger.warn(
          `[CAST_VOTE] Face verification FAILED - similarity: ${verificationResult.similarity} (threshold: ${matchThreshold})`,
        );
        const vote = new this.voteModel({
          voteId: this.generateVoteId(),
          electionId: request.electionId,
          voterId: request.voterId,
          candidateId: request.candidateId,
          timestamp: new Date(),
          status: 'rejected',
          faceVerificationPassed: false,
          faceVerificationSimilarity: verificationResult.similarity,
        });
        await vote.save();
        this.logger.log(
          `[CAST_VOTE] Rejected vote saved with voteId: ${vote.voteId}`,
        );

        return {
          success: false,
          message: 'Face verification failed',
          error: 'Voter identity could not be verified',
        };
      }

      this.logger.log(
        `[CAST_VOTE] Face verification PASSED, similarity: ${verificationResult.similarity}`,
      );
      this.logger.log(`[CAST_VOTE] Creating vote record in MongoDB`);
      const vote = new this.voteModel({
        voteId: this.generateVoteId(),
        electionId: request.electionId,
        voterId: request.voterId,
        candidateId: candidate.candidateId,
        timestamp: new Date(),
        status: 'verified',
        faceVerificationPassed: true,
        faceVerificationSimilarity: verificationResult.similarity,
      });
      await vote.save();
      this.logger.log(
        `[CAST_VOTE] Vote record created with voteId: ${vote.voteId}, status: verified`,
      );

      this.logger.log(`[CAST_VOTE] Recording vote on blockchain`);
      const blockchainData = await this.blockchainService.recordVote({
        voteId: vote.voteId,
        electionId: vote.electionId,
        voterId: vote.voterId,
        candidateId: vote.candidateId,
        timestamp: vote.timestamp,
        faceVerified: true,
      });
      vote.blockchainVoteData = {
        txHash: blockchainData.txHash,
        timestamp: blockchainData.timestamp,
        blockNumber: blockchainData.blockNumber,
        voteHash: blockchainData.data,
      };
      vote.blockchainTxHash = blockchainData.txHash;
      await vote.save();
      this.logger.log(
        `[CAST_VOTE] Vote recorded on blockchain, txHash: ${blockchainData.txHash}`,
      );

      this.logger.log(`[CAST_VOTE] Updating candidate vote count`);
      await this.candidateModel.updateOne(
        { candidateId: request.candidateId },
        { $inc: { voteCount: 1 } },
      );
      this.logger.log(`[CAST_VOTE] Candidate vote count incremented`);

      this.logger.log(
        `[CAST_VOTE] Vote cast completed successfully - voteId: ${vote.voteId}`,
      );
      return {
        success: true,
        message: 'Vote cast successfully',
        data: {
          voteId: vote.voteId,
          electionId: vote.electionId,
          voterId: vote.voterId,
          candidateId: vote.candidateId,
          status: vote.status,
          faceVerificationPassed: vote.faceVerificationPassed,
          blockchainTxHash: vote.blockchainTxHash,
        },
      };
    } catch (error) {
      this.logger.error(
        `[CAST_VOTE] Error casting vote: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to cast vote',
        error: error.message,
      };
    }
  }

  async deleteVoter(voterId: string): Promise<VoterResponse> {
    this.logger.log(`[DELETE_VOTER] Starting deletion for voter: ${voterId}`);

    try {
      const voter = await this.voterModel.findOne({ voterId });
      if (!voter) {
        throw new NotFoundException('Voter not found');
      }

      const voterData = {
        voterId: voter.voterId,
        userId: voter.userId,
        name: voter.name,
        email: voter.email,
      };

      this.logger.log(`[DELETE_VOTER] Recording voter deletion on blockchain`);
      const deletionRecord =
        await this.blockchainService.recordVoterDeletion(voterData);
      this.logger.log(
        `[DELETE_VOTER] Deletion recorded, txHash: ${deletionRecord.txHash}`,
      );

      this.logger.log(
        `[DELETE_VOTER] Deleting face recognition record for voter: ${voterId}`,
      );
      try {
        await this.facialRecognitionService.deleteUserFace(voterId);
        this.logger.log(
          `[DELETE_VOTER] Face recognition record deleted for voter: ${voterId}`,
        );
      } catch (faceError) {
        this.logger.warn(
          `[DELETE_VOTER] Failed to delete face recognition record: ${faceError.message}`,
        );
      }

      if (voter.faceImagePath) {
        const fullPath = path.join(process.cwd(), voter.faceImagePath);
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
        }
      }

      for (const docPath of voter.documentPaths) {
        const fullPath = path.join(process.cwd(), docPath);
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
        }
      }

      await this.voterModel.deleteOne({ voterId });

      this.logger.log(`[DELETE_VOTER] Voter deleted successfully: ${voterId}`);
      return {
        success: true,
        message: 'Voter deleted successfully',
        data: {
          voterId,
          blockchainTxHash: deletionRecord.txHash,
        },
      };
    } catch (error) {
      this.logger.error(
        `[DELETE_VOTER] Error deleting voter: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to delete voter',
        error: error.message,
      };
    }
  }

  async getVoteResults(electionId: string): Promise<ElectionResponse> {
    try {
      const election = await this.electionModel.findOne({ electionId });
      if (!election) {
        throw new NotFoundException('Election not found');
      }

      const votes = await this.voteModel.find({
        electionId,
        status: 'verified',
      });

      const allCandidates = await this.candidateModel.find();
      const candidateNameToIdMap = new Map<string, string>();
      allCandidates.forEach((c) => {
        candidateNameToIdMap.set(c.name, c.candidateId);
      });

      const results = election.candidates.map((candidate) => {
        const id = candidateNameToIdMap.get(candidate.name) || candidate.name;
        const candidateVotes = votes.filter((v) => v.candidateId === id);
        return {
          candidateId: id,
          name: candidate.name,
          party: candidate.party,
          voteCount: candidateVotes.length,
        };
      });

      return {
        success: true,
        message: 'Vote results retrieved successfully',
        data: {
          electionId: election.electionId,
          title: election.title,
          totalVotes: votes.length,
          results,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve vote results',
        error: error.message,
      };
    }
  }

  async getVoterVotes(voterId: string): Promise<VoterResponse> {
    try {
      const votes = await this.voteModel.find({ voterId });
      return {
        success: true,
        message: 'Voter votes retrieved successfully',
        data: votes,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve voter votes',
        error: error.message,
      };
    }
  }

  async getBlockchainVoteRecord(voteId: string): Promise<VoterResponse> {
    try {
      const vote = await this.voteModel.findOne({ voteId });
      if (!vote) {
        throw new NotFoundException('Vote not found');
      }

      return {
        success: true,
        message: 'Blockchain record retrieved successfully',
        data: vote.blockchainVoteData,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve blockchain record',
        error: error.message,
      };
    }
  }

  private async saveFaceImage(
    file: Express.Multer.File,
    voterId: string,
  ): Promise<string> {
    const filename = `${voterId}-face-${Date.now()}.${file.originalname.split('.').pop()}`;
    const filepath = path.join(this.assetsFolder, filename);
    await fs.promises.writeFile(filepath, file.buffer);
    return `/assets/voters/faces/${filename}`;
  }

  private async saveDocument(
    file: Express.Multer.File,
    voterId: string,
  ): Promise<string> {
    const filename = `${voterId}-doc-${Date.now()}-${file.originalname}`;
    const filepath = path.join(this.documentsFolder, filename);
    await fs.promises.writeFile(filepath, file.buffer);
    return `/assets/voters/documents/${filename}`;
  }

  private generateUserId(): string {
    return `USR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private generateVoterId(): string {
    return `VTR-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private generateElectionId(): string {
    return `ELEC-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private generateCandidateId(): string {
    return `CAND-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private generateVoteId(): string {
    return `VOTE-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private async registerVoterOnBlockchain(
    voter: any,
  ): Promise<{ txHash: string; timestamp: Date; blockNumber: number }> {
    try {
      const wallet = this.blockchainService.generateWallet();
      const data = `VOTER_REGISTRATION:${voter.voterId}:${voter.userId}:${voter.email}:${voter.name}`;
      const transaction = this.blockchainService.createTransaction(
        wallet.address,
        '0x0000000000000000000000000000000000000000',
        0,
        wallet.privateKey,
      );

      return {
        txHash: transaction.hash,
        timestamp: new Date(transaction.timestamp),
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      };
    } catch (error) {
      this.logger.error(`Blockchain registration error: ${error.message}`);
      return {
        txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        timestamp: new Date(),
        blockNumber: 0,
      };
    }
  }

  private async createElectionOnBlockchain(
    election: any,
  ): Promise<{ txHash: string; timestamp: Date; blockNumber: number }> {
    try {
      const wallet = this.blockchainService.generateWallet();
      const data = `ELECTION_CREATION:${election.electionId}:${election.title}:${election.startDate}:${election.endDate}`;
      const transaction = this.blockchainService.createTransaction(
        wallet.address,
        '0x0000000000000000000000000000000000000000',
        0,
        wallet.privateKey,
      );

      return {
        txHash: transaction.hash,
        timestamp: new Date(transaction.timestamp),
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      };
    } catch (error) {
      this.logger.error(`Blockchain election creation error: ${error.message}`);
      return {
        txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        timestamp: new Date(),
        blockNumber: 0,
      };
    }
  }

  private async recordVoteOnBlockchain(
    vote: any,
    election: any,
  ): Promise<{
    txHash: string;
    timestamp: Date;
    blockNumber: number;
    voteHash: string;
  }> {
    try {
      const wallet = this.blockchainService.generateWallet();
      const voteHash = crypto
        .createHash('sha256')
        .update(
          `${vote.voteId}${vote.electionId}${vote.voterId}${vote.candidateId}`,
        )
        .digest('hex');
      const data = `VOTE_CAST:${vote.voteId}:${vote.electionId}:${vote.voterId}:${vote.candidateId}:${voteHash}`;
      const transaction = this.blockchainService.createTransaction(
        wallet.address,
        '0x0000000000000000000000000000000000000000',
        0,
        wallet.privateKey,
      );

      return {
        txHash: transaction.hash,
        timestamp: new Date(transaction.timestamp),
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        voteHash,
      };
    } catch (error) {
      this.logger.error(`Blockchain vote recording error: ${error.message}`);
      return {
        txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        timestamp: new Date(),
        blockNumber: 0,
        voteHash: crypto
          .createHash('sha256')
          .update(
            `${vote.voteId}${vote.electionId}${vote.voterId}${vote.candidateId}`,
          )
          .digest('hex'),
      };
    }
  }
}
