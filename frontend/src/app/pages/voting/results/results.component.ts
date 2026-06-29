import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VotingService } from '../../../services/voting.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="results-page">
      <div class="card">
        <h2>Election Results</h2>
        <p class="subtitle">Select an election to view candidate results</p>

        <div class="form-group">
          <label>Select Election</label>
          <select
            [(ngModel)]="selectedElectionId"
            (change)="onElectionSelect()"
            [disabled]="loading"
          >
            <option value="">-- Select an election --</option>
            <option *ngFor="let e of elections" [value]="e.electionId">
              {{ e.title }} ({{ e.status }})
            </option>
          </select>
        </div>

        <div *ngIf="loading" class="loading">Loading results...</div>

        <div *ngIf="!loading && selectedElection" class="election-detail">
          <div class="election-header">
            <h3>{{ selectedElection.title }}</h3>
            <span class="badge" [class]="'badge-' + selectedElection.status">{{
              selectedElection.status
            }}</span>
          </div>
          <p class="election-desc" *ngIf="selectedElection.description">
            {{ selectedElection.description }}
          </p>

          <div *ngIf="results.length" class="results">
            <div
              *ngFor="let r of sortedResults; let i = index"
              class="result-row"
            >
              <div class="rank">#{{ i + 1 }}</div>
              <div class="candidate-info">
                <div class="name">{{ r.name }}</div>
                <div class="party" *ngIf="r.party">{{ r.party }}</div>
              </div>
              <div class="vote-count">{{ r.voteCount }} votes</div>
              <div class="bar-container">
                <div
                  class="bar"
                  [style.width.%]="percentage(r.voteCount)"
                  [style.background]="getBarColor(i)"
                ></div>
              </div>
            </div>
            <div class="total">Total votes: {{ totalVotes }}</div>
          </div>

          <div *ngIf="!results.length" class="empty">
            No votes cast yet for this election.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .results-page h2 {
        margin: 0 0 0.25rem;
        color: #1a1a2e;
      }
      .subtitle {
        color: #888;
        margin: 0 0 1.5rem;
        font-size: 0.9rem;
      }
      .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        max-width: 700px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 1.5rem;
      }
      label {
        font-size: 0.85rem;
        font-weight: 500;
        color: #555;
        margin-bottom: 0.3rem;
      }
      select {
        padding: 0.65rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      select:focus {
        outline: none;
        border-color: #4361ee;
      }
      .election-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .election-header h3 {
        margin: 0;
        color: #1a1a2e;
        font-size: 1.2rem;
      }
      .election-desc {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
      }
      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
      }
      .badge-draft {
        background: #f0f0f0;
        color: #666;
      }
      .badge-scheduled {
        background: #dbeafe;
        color: #1e40af;
      }
      .badge-active {
        background: #d1fae5;
        color: #065f46;
      }
      .badge-completed {
        background: #e0e7ff;
        color: #3730a3;
      }
      .results {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
      }
      .result-row {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .rank {
        font-size: 1.5rem;
        font-weight: 700;
        color: #4361ee;
        width: 40px;
      }
      .candidate-info {
        flex: 1;
      }
      .name {
        font-weight: 600;
        color: #1a1a2e;
      }
      .party {
        font-size: 0.85rem;
        color: #666;
      }
      .vote-count {
        font-weight: 700;
        color: #4361ee;
        white-space: nowrap;
      }
      .bar-container {
        flex: 2;
        background: #f0f2f5;
        border-radius: 4px;
        height: 24px;
        overflow: hidden;
      }
      .bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
      }
      .total {
        text-align: center;
        color: #666;
        margin-top: 1rem;
        font-weight: 500;
      }
      .loading {
        color: #888;
        text-align: center;
        padding: 2rem;
      }
      .empty {
        color: #999;
        text-align: center;
        padding: 2rem;
      }
    `,
  ],
})
export class ResultsComponent implements OnInit {
  elections: any[] = [];
  selectedElectionId = '';
  selectedElection: any = null;
  results: any[] = [];
  loading = false;

  constructor(private votingService: VotingService) {}

  ngOnInit() {
    this.loadElections();
  }

  loadElections() {
    this.votingService.getAllElections().subscribe({
      next: (res) => (this.elections = res),
      error: () => {},
    });
  }

  get sortedResults(): any[] {
    const hasVotes = this.results.some((r) => r.voteCount > 0);
    if (hasVotes) {
      return [...this.results].sort((a, b) => b.voteCount - a.voteCount);
    }
    return [...this.results].sort((a, b) => a.name.localeCompare(b.name));
  }

  get totalVotes(): number {
    return this.results.reduce((sum, r) => sum + r.voteCount, 0);
  }

  percentage(count: number): number {
    return this.totalVotes > 0 ? (count / this.totalVotes) * 100 : 0;
  }

  getBarColor(index: number): string {
    const colors = [
      '#4361ee',
      '#2ecc71',
      '#f39c12',
      '#e74c3c',
      '#9b59b6',
      '#3498db',
    ];
    return colors[index % colors.length];
  }

  onElectionSelect() {
    if (!this.selectedElectionId) {
      this.selectedElection = null;
      this.results = [];
      return;
    }

    this.selectedElection =
      this.elections.find((e) => e.electionId === this.selectedElectionId) ||
      null;

    this.loading = true;
    this.results = [];
    this.votingService.getVoteResults(this.selectedElectionId).subscribe({
      next: (res) => {
        this.results = res.results || res;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
