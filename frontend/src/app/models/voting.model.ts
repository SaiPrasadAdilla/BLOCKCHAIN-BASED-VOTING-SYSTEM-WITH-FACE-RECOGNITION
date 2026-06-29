export interface Voter {
  _id: string;
  voterId: string;
  userId: string;
  name: string;
  email: string;
  faceImagePath?: string;
  documentPaths?: string[];
  status: 'pending' | 'approved' | 'rejected';
  assignedAt?: string;
  approvedBy?: string;
  blockchainTxHash?: string;
  blockchainRegistration?: {
    txHash: string;
    timestamp: string;
    blockNumber: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Election {
  _id: string;
  electionId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  eligibleVoterIds?: string[];
  candidates?: Candidate[];
  createdBy?: string;
  blockchainTxHash?: string;
  blockchainElectionData?: {
    txHash: string;
    timestamp: string;
    blockNumber: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Candidate {
  _id: string;
  candidateId: string;
  name: string;
  party?: string;
  description?: string;
  manifesto?: string;
  imagePath?: string;
  electionId?: string;
  voteCount: number;
  createdAt?: string;
}

export interface Vote {
  _id: string;
  voteId: string;
  electionId: string;
  voterId: string;
  candidateId: string;
  timestamp: string;
  status: 'pending' | 'verified' | 'rejected';
  faceVerificationPassed?: boolean;
  faceVerificationSimilarity?: number;
  blockchainTxHash?: string;
  blockchainVoteData?: {
    txHash: string;
    timestamp: string;
    blockNumber: number;
    voteHash: string;
  };
  createdAt?: string;
}

export interface VoteResult {
  candidateId: string;
  name: string;
  party?: string;
  voteCount: number;
}
