export interface BlockchainStats {
  blockNumber?: number;
  networkVersion?: string;
  gasPrice?: string;
  [key: string]: unknown;
}

export interface BlockDetails {
  number?: number;
  hash?: string;
  timestamp?: string;
  transactions?: string[];
  [key: string]: unknown;
}

export interface TransactionDetails {
  hash?: string;
  from?: string;
  to?: string;
  value?: string;
  blockNumber?: number;
  [key: string]: unknown;
}

export interface BlockchainBlock {
  number?: number;
  hash?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface BlockchainTransaction {
  hash?: string;
  from?: string;
  to?: string;
  value?: string;
  [key: string]: unknown;
}
