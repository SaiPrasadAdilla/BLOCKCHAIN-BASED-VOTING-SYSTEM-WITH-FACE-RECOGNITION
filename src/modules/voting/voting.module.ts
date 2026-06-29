import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VotingController } from './voting.controller';
import { VotingService } from './voting.service';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import {
  Voter,
  Election,
  Vote,
  Candidate,
  voterSchema,
  electionSchema,
  voteSchema,
  candidateSchema,
} from '../../schemas/voting.schema';
import { FacialRecognitionModule } from '../facial-recognition/facial-recognition.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Voter.name, schema: voterSchema },
      { name: Election.name, schema: electionSchema },
      { name: Vote.name, schema: voteSchema },
      { name: Candidate.name, schema: candidateSchema },
    ]),
    forwardRef(() => FacialRecognitionModule),
    BlockchainModule,
  ],
  controllers: [VotingController, CandidateController],
  providers: [VotingService, CandidateService],
  exports: [VotingService, CandidateService],
})
export class VotingModule {}
