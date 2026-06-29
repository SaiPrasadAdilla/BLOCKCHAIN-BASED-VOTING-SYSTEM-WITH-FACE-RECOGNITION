import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VotingService } from '../../services/voting.service';
import { CandidateService } from '../../services/candidate.service';
import { BlockchainService } from '../../services/blockchain.service';

interface LiveResult {
  electionId: string;
  title: string;
  totalVotes: number;
  results: Array<{
    candidateId: string;
    name: string;
    party: string;
    voteCount: number;
  }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="stats-row">
        <a
          routerLink="/voting/manage-voters"
          class="stat-card approved"
          title="Approved Voters"
        >
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ approvedVotersCount }}</div>
          <div class="stat-label">Approved Voters</div>
        </a>
        <a
          routerLink="/voting/manage-elections"
          class="stat-card active"
          title="Active Elections"
        >
          <div class="stat-icon">🗳️</div>
          <div class="stat-value">{{ activeElectionsCount }}</div>
          <div class="stat-label">Active Elections</div>
        </a>
        <a
          routerLink="/voting/candidates"
          class="stat-card candidates"
          title="Candidates"
        >
          <div class="stat-icon">🎯</div>
          <div class="stat-value">{{ candidatesCount }}</div>
          <div class="stat-label">Candidates</div>
        </a>
        <a
          routerLink="/blockchain"
          class="stat-card blockchain"
          title="Blockchain Explorer"
        >
          <div class="stat-icon">⛓️</div>
          <div class="stat-value">{{ blockNumber || 'N/A' }}</div>
          <div class="stat-label">Blockchain Explorer</div>
        </a>
      </div>

      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="actions-grid">
          <a routerLink="/voting/register" class="action-btn"
            >📝 Register Voter</a
          >
          <a routerLink="/voting/manage-voters" class="action-btn"
            >🗂️ Manage Voters</a
          >
          <a routerLink="/voting/manage-elections" class="action-btn"
            >📋 Manage Elections</a
          >
          <a routerLink="/voting/cast-vote" class="action-btn">✅ Cast Vote</a>
          <a routerLink="/voting/results" class="action-btn">📈 View Results</a>
          <a routerLink="/voting/candidates" class="action-btn"
            >🎯 Manage Candidates</a
          >
          <a routerLink="/blockchain" class="action-btn"
            >⛓️ Blockchain Explorer</a
          >
        </div>
      </div>

      <div class="live-results-card">
        <h3>
          Live Results
          <span class="live-dot" *ngIf="activeElections.length">
            <span class="pulse"></span> LIVE
          </span>
        </h3>
        <div *ngIf="resultsLoading" class="loading">Loading results...</div>
        <div
          *ngIf="!resultsLoading && activeElections.length === 0"
          class="empty"
        >
          No active elections.
        </div>
        <div *ngFor="let result of liveResults" class="election-results">
          <div class="election-header">
            <h4>{{ result.title }}</h4>
            <span class="vote-total">{{ result.totalVotes }} votes</span>
          </div>
          <div class="result-bars">
            <div *ngFor="let r of sorted(result.results)" class="result-row">
              <div class="result-name">
                <span class="rank">#{{ rank(result.results, r) }}</span>
                {{ r.name }}
              </div>
              <div class="bar-wrap">
                <div
                  class="bar"
                  [style.width.%]="pct(result.totalVotes, r.voteCount)"
                ></div>
              </div>
              <div class="result-count">{{ r.voteCount }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard {
        max-width: 900px;
      }
      .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .stat-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border-left: 4px solid #666;
        text-decoration: none;
        transition: transform 0.15s;
      }
      .stat-card:hover {
        transform: translateY(-2px);
      }
      .stat-card.approved {
        border-left-color: #2ecc71;
      }
      .stat-card.active {
        border-left-color: #4361ee;
      }
      .stat-card.blockchain {
        border-left-color: #9b59b6;
      }
      .stat-icon {
        font-size: 1.8rem;
        margin-bottom: 0.25rem;
      }
      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a2e;
      }
      .stat-label {
        color: #666;
        font-size: 0.85rem;
        margin-top: 0.15rem;
      }
      .stat-card.candidates {
        border-left-color: #e67e22;
      }
      .quick-actions {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;
      }
      .quick-actions h3 {
        margin: 0 0 1rem;
        color: #1a1a2e;
        font-size: 1.1rem;
      }
      .actions-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }
      .action-btn {
        background: #f5f6fa;
        border: 1px solid #e0e0e0;
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        text-decoration: none;
        color: #333;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s;
      }
      .action-btn:hover {
        background: #4361ee;
        color: white;
        border-color: #4361ee;
      }
      .live-results-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }
      .live-results-card h3 {
        margin: 0 0 1rem;
        color: #1a1a2e;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .live-dot {
        font-size: 0.75rem;
        font-weight: 600;
        color: #e74c3c;
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }
      .pulse {
        width: 8px;
        height: 8px;
        background: #e74c3c;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.5;
          transform: scale(1.3);
        }
      }
      .election-results {
        margin-bottom: 1.5rem;
      }
      .election-results:last-child {
        margin-bottom: 0;
      }
      .election-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .election-header h4 {
        margin: 0;
        color: #1a1a2e;
      }
      .vote-total {
        font-size: 0.85rem;
        color: #888;
      }
      .result-bars {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .result-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .result-name {
        min-width: 120px;
        font-weight: 500;
        font-size: 0.9rem;
        color: #1a1a2e;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .rank {
        font-weight: 700;
        color: #4361ee;
        font-size: 0.8rem;
      }
      .bar-wrap {
        flex: 1;
        height: 22px;
        background: #f0f2f5;
        border-radius: 4px;
        overflow: hidden;
      }
      .bar {
        height: 100%;
        background: linear-gradient(90deg, #4361ee, #7b93f5);
        border-radius: 4px;
        transition: width 0.5s ease;
        min-width: 2px;
      }
      .result-count {
        font-weight: 700;
        font-size: 0.9rem;
        color: #4361ee;
        min-width: 30px;
        text-align: right;
      }
      .loading {
        color: #888;
        text-align: center;
        padding: 1rem;
        font-size: 0.9rem;
      }
      .empty {
        color: #aaa;
        text-align: center;
        padding: 1rem;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  approvedVotersCount = 0;
  activeElectionsCount = 0;
  blockNumber: number | null = null;

  candidatesCount = 0;

  activeElections: any[] = [];
  liveResults: LiveResult[] = [];
  resultsLoading = true;
  private refreshTimer: any;

  constructor(
    private votingService: VotingService,
    private candidateService: CandidateService,
    private blockchainService: BlockchainService,
  ) {}

  ngOnInit() {
    this.votingService.getVotersByStatus('approved').subscribe({
      next: (res) => (this.approvedVotersCount = res?.length || 0),
      error: () => {},
    });
    this.votingService.getActiveElections().subscribe({
      next: (res) => {
        this.activeElections = res || [];
        this.activeElectionsCount = this.activeElections.length;
        this.loadResults();
        this.refreshTimer = setInterval(() => this.loadResults(), 5000);
      },
      error: () => {
        this.resultsLoading = false;
      },
    });
    this.blockchainService.getStats().subscribe({
      next: (res) => (this.blockNumber = res?.blockNumber || null),
      error: () => {},
    });
    this.candidateService.getAllCandidates().subscribe({
      next: (res) => {
        this.candidatesCount = res?.length || 0;
      },
      error: () => {},
    });
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadResults() {
    if (!this.activeElections.length) {
      this.resultsLoading = false;
      return;
    }
    this.resultsLoading = true;
    this.liveResults = [];
    let done = 0;
    for (const election of this.activeElections) {
      this.votingService.getVoteResults(election.electionId).subscribe({
        next: (res) => {
          this.liveResults.push(res);
          done++;
          if (done === this.activeElections.length) this.resultsLoading = false;
        },
        error: () => {
          done++;
          if (done === this.activeElections.length) this.resultsLoading = false;
        },
      });
    }
  }

  sorted(results: any[]): any[] {
    return [...results].sort((a, b) => b.voteCount - a.voteCount);
  }

  pct(total: number, count: number): number {
    return total > 0 ? (count / total) * 100 : 0;
  }

  rank(results: any[], item: any): number {
    return (
      [...results]
        .sort((a, b) => b.voteCount - a.voteCount)
        .findIndex((r) => r.candidateId === item.candidateId) + 1
    );
  }
}
