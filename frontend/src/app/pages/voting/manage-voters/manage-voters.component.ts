import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VotingService } from '../../../services/voting.service';
import { Voter } from '../../../models/voting.model';

@Component({
  selector: 'app-manage-voters',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="voters-page">
      <div class="tabs">
        <button
          *ngFor="let tab of tabs"
          [class.active]="activeTab === tab.value"
          (click)="activeTab = tab.value; loadVoters()"
        >
          {{ tab.label }} <span class="count">{{ getCount(tab.value) }}</span>
        </button>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>{{ activeTabLabel }} Voters</h2>
          <span class="count-badge">{{ filteredVoters.length }} voters</span>
        </div>
        <div *ngIf="loading">Loading...</div>
        <table *ngIf="!loading && filteredVoters.length" class="table">
          <thead>
            <tr>
              <th>Voter ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of filteredVoters">
              <td class="id-cell">{{ v.voterId }}</td>
              <td>{{ v.name }}</td>
              <td>{{ v.email }}</td>
              <td>
                <span class="badge" [class]="'badge-' + v.status">{{
                  v.status
                }}</span>
              </td>
              <td>{{ v.createdAt | date: 'short' }}</td>
              <td class="actions">
                <button
                  *ngIf="v.status === 'pending'"
                  (click)="approve(v)"
                  class="btn-approve"
                >
                  Approve
                </button>
                <button
                  *ngIf="v.status === 'pending'"
                  (click)="reject(v)"
                  class="btn-reject"
                >
                  Reject
                </button>
                <button (click)="deleteVoter(v)" class="btn-delete">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!loading && !filteredVoters.length" class="empty">
          No voters in this category.
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .voters-page h2 {
        margin: 0;
        color: #1a1a2e;
        font-size: 1.2rem;
      }
      .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }
      .tabs button {
        padding: 0.6rem 1.2rem;
        border: 1px solid #e0e0e0;
        background: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        color: #555;
        transition: all 0.2s;
      }
      .tabs button.active {
        background: #4361ee;
        color: white;
        border-color: #4361ee;
      }
      .tabs .count {
        background: rgba(255, 255, 255, 0.2);
        padding: 0.1rem 0.5rem;
        border-radius: 10px;
        font-size: 0.75rem;
        margin-left: 0.3rem;
      }
      .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .count-badge {
        background: #f0f2f5;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.85rem;
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
      }
      th {
        font-weight: 600;
        color: #555;
        font-size: 0.8rem;
        text-transform: uppercase;
      }
      .id-cell {
        font-family: monospace;
        font-size: 0.8rem;
        color: #888;
      }
      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
      }
      .badge-pending {
        background: #fef3c7;
        color: #92400e;
      }
      .badge-approved {
        background: #d1fae5;
        color: #065f46;
      }
      .badge-rejected {
        background: #fee2e2;
        color: #991b1b;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
      }
      .btn-approve {
        padding: 0.4rem 0.8rem;
        background: #2ecc71;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-reject {
        padding: 0.4rem 0.8rem;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-delete {
        padding: 0.4rem 0.8rem;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-delete:hover {
        background: #dc3545;
      }
      .empty {
        color: #999;
        text-align: center;
        padding: 2rem;
      }
    `,
  ],
})
export class ManageVotersComponent implements OnInit {
  tabs = [
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' },
  ];
  activeTab = 'approved';
  voters: Voter[] = [];
  filteredVoters: Voter[] = [];
  loading = false;
  counts = { pending: 0, approved: 0, rejected: 0 };

  get activeTabLabel(): string {
    const tab = this.tabs.find((t) => t.value === this.activeTab);
    return tab ? tab.label : 'Pending';
  }

  constructor(private votingService: VotingService) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.votingService.getVotersByStatus('pending').subscribe({
      next: (res) => {
        this.counts.pending = res.length;
        this.checkDone();
      },
    });
    this.votingService.getVotersByStatus('approved').subscribe({
      next: (res) => {
        this.counts.approved = res.length;
        this.checkDone();
      },
    });
    this.votingService.getVotersByStatus('rejected').subscribe({
      next: (res) => {
        this.counts.rejected = res.length;
        this.checkDone();
      },
    });
  }

  checkDone() {
    this.loadVoters();
    this.loading = false;
  }

  getCount(status: string): number {
    return this.counts[status as keyof typeof this.counts] || 0;
  }

  loadVoters() {
    this.loading = true;
    this.votingService
      .getVotersByStatus(this.activeTab as 'pending' | 'approved' | 'rejected')
      .subscribe({
        next: (res) => {
          this.filteredVoters = res;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  approve(voter: Voter) {
    this.votingService.approveVoter(voter.voterId).subscribe({
      next: () => {
        this.loadAll();
      },
      error: () => {},
    });
  }

  reject(voter: Voter) {
    this.votingService.rejectVoter(voter.voterId).subscribe({
      next: () => {
        this.loadAll();
      },
      error: () => {},
    });
  }

  deleteVoter(voter: Voter) {
    if (
      !confirm(
        `Delete voter ${voter.name} (${voter.voterId})? This action cannot be undone.`,
      )
    ) {
      return;
    }
    this.votingService.deleteVoter(voter.voterId).subscribe({
      next: () => {
        this.loadAll();
      },
      error: () => {},
    });
  }
}
