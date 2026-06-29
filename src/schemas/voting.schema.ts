import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type VoterDocument = Voter & Document;

@Schema({ timestamps: true })
export class Voter {
  @Prop({ required: true, index: true, unique: true })
  voterId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  faceImagePath: string;

  @Prop({ type: [String], default: [] })
  documentPaths: string[];

  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: string;

  @Prop()
  assignedAt: Date;

  @Prop()
  approvedBy: string;

  @Prop()
  blockchainTxHash: string;

  @Prop({ type: Object })
  blockchainRegistration: {
    txHash: string;
    timestamp: Date;
    blockNumber: number;
  };
}

export const voterSchema = SchemaFactory.createForClass(Voter);

export type ElectionDocument = Election & Document;

@Schema({ timestamps: true })
export class Election {
  @Prop()
  electionId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    required: true,
    enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: [String], default: [] })
  eligibleVoterIds: string[];

  @Prop({ type: [Object], default: [] })
  candidates: Array<{ name: string; party: string; description?: string }>;

  @Prop()
  createdBy: string;

  @Prop()
  blockchainTxHash: string;

  @Prop({ type: Object })
  blockchainElectionData: {
    txHash: string;
    timestamp: Date;
    blockNumber: number;
  };
}

export const electionSchema = SchemaFactory.createForClass(Election);

export type VoteDocument = Vote & Document;

@Schema({ timestamps: true })
export class Vote {
  @Prop({ required: true, index: true, unique: true })
  voteId: string;

  @Prop({ required: true, index: true })
  electionId: string;

  @Prop({ required: true, index: true })
  voterId: string;

  @Prop({ required: true })
  candidateId: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({
    required: true,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  })
  status: string;

  @Prop()
  faceVerificationPassed: boolean;

  @Prop()
  faceVerificationSimilarity: number;

  @Prop()
  blockchainTxHash: string;

  @Prop({ type: Object })
  blockchainVoteData: {
    txHash: string;
    timestamp: Date;
    blockNumber: number;
    voteHash: string;
  };
}

export const voteSchema = SchemaFactory.createForClass(Vote);

export type CandidateDocument = Candidate & Document;

@Schema({ timestamps: true })
export class Candidate {
  @Prop({ required: true })
  candidateId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  party: string;

  @Prop()
  description: string;

  @Prop()
  manifesto: string;

  @Prop()
  imagePath: string;

  @Prop({ default: 0 })
  voteCount: number;
}

export const candidateSchema = SchemaFactory.createForClass(Candidate);
