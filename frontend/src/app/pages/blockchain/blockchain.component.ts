import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlockchainService } from '../../services/blockchain.service';

@Component({
  selector: 'app-blockchain',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="blockchain-page">
      <div class="card">
        <div class="card-header">
          <h2>Blockchain Transaction Ledger</h2>
          <button (click)="loadRecords()" class="btn-primary">Refresh</button>
        </div>
        <div *ngIf="loading" class="loading">Loading transactions...</div>
        <table *ngIf="!loading && records.length" class="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Entity</th>
              <th>Transaction Hash</th>
              <th>Block #</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of records">
              <td>
                <span class="badge" [class]="'badge-' + getTypeClass(r.type)">{{
                  formatType(r.type)
                }}</span>
              </td>
              <td>
                <div class="entity-name">{{ r.entityName || 'N/A' }}</div>
                <div class="entity-id">{{ r.entityId || '' }}</div>
              </td>
              <td
                class="hash-cell"
                (click)="viewRecord(r)"
                title="Click to view details"
              >
                {{ r.txHash }}
              </td>
              <td>{{ r.blockNumber }}</td>
              <td>{{ r.timestamp | date: 'short' }}</td>
              <td>
                <button (click)="viewRecord(r)" class="btn-view">View</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!loading && !records.length" class="empty">
          No blockchain transactions recorded yet.
        </div>
      </div>

      <div *ngIf="selectedRecord" class="card">
        <div class="card-header">
          <h2>Transaction Details</h2>
          <button (click)="selectedRecord = null" class="btn-close">
            &times;
          </button>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Type</label>
            <span
              class="badge"
              [class]="'badge-' + getTypeClass(selectedRecord.type)"
              >{{ formatType(selectedRecord.type) }}</span
            >
          </div>
          <div class="detail-item">
            <label>Transaction Hash</label>
            <span class="hash">{{ selectedRecord.txHash }}</span>
          </div>
          <div class="detail-item">
            <label>Block Number</label>
            <span>{{ selectedRecord.blockNumber }}</span>
          </div>
          <div class="detail-item">
            <label>Network</label>
            <span>{{ selectedRecord.network }}</span>
          </div>
          <div class="detail-item">
            <label>Timestamp</label>
            <span>{{ selectedRecord.timestamp | date: 'medium' }}</span>
          </div>
          <div class="detail-item" *ngIf="selectedRecord.entityName">
            <label>Entity Name</label>
            <span>{{ selectedRecord.entityName }}</span>
          </div>
          <div class="detail-item" *ngIf="selectedRecord.entityId">
            <label>Entity ID</label>
            <span class="hash">{{ selectedRecord.entityId }}</span>
          </div>
        </div>
        <div *ngIf="selectedRecord.metadata" class="metadata-section">
          <label>Metadata</label>
          <pre>{{ selectedRecord.metadata | json }}</pre>
        </div>
        <div class="data-section">
          <label>Data Payload</label>
          <pre>{{ selectedRecord.data }}</pre>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .blockchain-page h2 {
        margin: 0;
        color: #1a1a2e;
        font-size: 1.2rem;
      }
      .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .btn-primary {
        padding: 0.65rem 1.5rem;
        background: #4361ee;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-view {
        padding: 0.3rem 0.8rem;
        background: #4361ee;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-close {
        padding: 0.2rem 0.6rem;
        background: transparent;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.2rem;
        color: #666;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #f0f0f0;
        font-size: 0.9rem;
      }
      th {
        font-weight: 600;
        color: #555;
        font-size: 0.8rem;
        text-transform: uppercase;
      }
      .hash-cell {
        font-family: monospace;
        font-size: 0.75rem;
        color: #4361ee;
        cursor: pointer;
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .hash-cell:hover {
        text-decoration: underline;
      }
      .entity-name {
        font-weight: 500;
        color: #333;
      }
      .entity-id {
        font-family: monospace;
        font-size: 0.75rem;
        color: #888;
      }
      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
      }
      .badge-VOTER_REGISTRATION {
        background: #dbeafe;
        color: #1e40af;
      }
      .badge-ELECTION_CREATION {
        background: #d1fae5;
        color: #065f46;
      }
      .badge-VOTE_CAST {
        background: #fef3c7;
        color: #92400e;
      }
      .badge-CANDIDATE_DELETION {
        background: #fee2e2;
        color: #991b1b;
      }
      .badge-VOTER_DELETION {
        background: #f3e8ff;
        color: #6b21a8;
      }
      .loading {
        color: #666;
        text-align: center;
        padding: 2rem;
      }
      .empty {
        color: #999;
        text-align: center;
        padding: 2rem;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
      .detail-item {
        display: flex;
        flex-direction: column;
      }
      .detail-item label {
        font-size: 0.75rem;
        color: #888;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
      }
      .detail-item .hash {
        font-family: monospace;
        font-size: 0.8rem;
        word-break: break-all;
        color: #4361ee;
      }
      .metadata-section,
      .data-section {
        margin-top: 1rem;
      }
      .metadata-section label,
      .data-section label {
        font-size: 0.75rem;
        color: #888;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
        display: block;
      }
      pre {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        font-size: 0.8rem;
        overflow-x: auto;
        margin: 0;
      }
    `,
  ],
})
export class BlockchainComponent implements OnInit {
  records: any[] = [];
  loading = false;
  selectedRecord: any = null;

  constructor(private blockchainService: BlockchainService) {}

  ngOnInit() {
    this.loadRecords();
  }

  loadRecords() {
    this.loading = true;
    this.selectedRecord = null;
    this.blockchainService.getRecords(50).subscribe({
      next: (res) => {
        this.records = res;
        this.loading = false;
      },
      error: () => {
        this.records = [];
        this.loading = false;
      },
    });
  }

  viewRecord(record: any) {
    this.selectedRecord = record;
  }

  formatType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getTypeClass(type: string): string {
    return type;
  }
}
