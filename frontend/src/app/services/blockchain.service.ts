import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BlockchainStats,
  BlockDetails,
  TransactionDetails,
  BlockchainBlock,
  BlockchainTransaction,
} from '../models/blockchain.model';

@Injectable({ providedIn: 'root' })
export class BlockchainService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStats(): Observable<BlockchainStats> {
    return this.http.get<BlockchainStats>(`${this.apiUrl}/blockchain/stats`);
  }

  getBlockDetails(blockNumber: number): Observable<BlockDetails> {
    return this.http.get<BlockDetails>(
      `${this.apiUrl}/blockchain/block/${blockNumber}`,
    );
  }

  getTransactionDetails(txHash: string): Observable<TransactionDetails> {
    return this.http.get<TransactionDetails>(
      `${this.apiUrl}/blockchain/transaction/${txHash}`,
    );
  }

  getBlocks(
    startBlock: number,
    endBlock: number,
  ): Observable<BlockchainBlock[]> {
    const params = new HttpParams()
      .set('startBlock', startBlock.toString())
      .set('endBlock', endBlock.toString());
    return this.http.get<BlockchainBlock[]>(
      `${this.apiUrl}/blockchain/blocks`,
      { params },
    );
  }

  getRecentTransactions(limit = 10): Observable<BlockchainTransaction[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<BlockchainTransaction[]>(
      `${this.apiUrl}/blockchain/transactions`,
      { params },
    );
  }

  getRecords(limit = 50): Observable<any[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<any[]>(`${this.apiUrl}/blockchain/records`, {
      params,
    });
  }

  getRecordByTxHash(txHash: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/blockchain/record/${txHash}`);
  }
}
