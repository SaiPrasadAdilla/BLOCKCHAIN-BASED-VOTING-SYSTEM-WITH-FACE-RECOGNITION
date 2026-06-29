import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Candidate, CandidateDocument } from '../../schemas/voting.schema';
import { BlockchainService } from '../blockchain/blockchain.service';
import * as crypto from 'crypto';

export interface RegisterCandidateRequest {
  name: string;
  party: string;
  description?: string;
  manifesto?: string;
}

export interface CandidateResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

@Injectable()
export class CandidateService {
  private readonly logger = new Logger(CandidateService.name);

  constructor(
    @InjectModel(Candidate.name)
    private candidateModel: Model<CandidateDocument>,
    private blockchainService: BlockchainService,
  ) {}

  async registerCandidate(
    request: RegisterCandidateRequest,
  ): Promise<CandidateResponse> {
    this.logger.log(
      `[REGISTER_CANDIDATE] Registering: ${request.name} (${request.party})`,
    );

    try {
      const existingCandidate = await this.candidateModel.findOne({
        name: request.name,
        party: request.party,
      });
      if (existingCandidate) {
        return {
          success: false,
          message: 'Candidate already exists with this name and party',
          error: 'Duplicate candidate',
        };
      }

      const candidateId = this.generateCandidateId();
      const candidate = new this.candidateModel({
        candidateId,
        name: request.name,
        party: request.party,
        description: request.description,
        manifesto: request.manifesto,
        voteCount: 0,
      });
      await candidate.save();

      this.logger.log(
        `[REGISTER_CANDIDATE] Candidate registered: ${candidateId}`,
      );
      return {
        success: true,
        message: 'Candidate registered successfully',
        data: {
          candidateId: candidate.candidateId,
          name: candidate.name,
          party: candidate.party,
          description: candidate.description,
          manifesto: candidate.manifesto,
          voteCount: candidate.voteCount,
          createdAt: (candidate as any).createdAt,
        },
      };
    } catch (error) {
      this.logger.error(
        `[REGISTER_CANDIDATE] Error: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to register candidate',
        error: error.message,
      };
    }
  }

  async getAllCandidates(): Promise<CandidateResponse> {
    try {
      const candidates = await this.candidateModel
        .find()
        .sort({ createdAt: -1 });
      return {
        success: true,
        message: 'Candidates retrieved successfully',
        data: candidates,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve candidates',
        error: error.message,
      };
    }
  }

  async getCandidate(candidateId: string): Promise<CandidateResponse> {
    try {
      const candidate = await this.candidateModel.findOne({ candidateId });
      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }
      return {
        success: true,
        message: 'Candidate retrieved successfully',
        data: candidate,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve candidate',
        error: error.message,
      };
    }
  }

  async deleteCandidate(candidateId: string): Promise<CandidateResponse> {
    try {
      const candidate = await this.candidateModel.findOne({ candidateId });
      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }

      const blockchainResult =
        await this.blockchainService.recordCandidateDeletion({
          candidateId: candidate.candidateId,
          name: candidate.name,
          party: candidate.party,
        });

      await this.candidateModel.deleteOne({ candidateId });
      this.logger.log(
        `[DELETE_CANDIDATE] Candidate deleted: ${candidateId}, txHash: ${blockchainResult.txHash}`,
      );
      return {
        success: true,
        message: 'Candidate deleted successfully',
        data: { txHash: blockchainResult.txHash },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete candidate',
        error: error.message,
      };
    }
  }

  private generateCandidateId(): string {
    return `CAND-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }
}
