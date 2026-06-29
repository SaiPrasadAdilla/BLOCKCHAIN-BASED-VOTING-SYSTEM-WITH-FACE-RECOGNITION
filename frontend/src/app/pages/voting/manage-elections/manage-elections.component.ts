import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VotingService } from '../../../services/voting.service';
import { CandidateService } from '../../../services/candidate.service';
import { Election, Candidate } from '../../../models/voting.model';

@Component({
  selector: 'app-manage-elections',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="elections-page">
      <div class="tabs">
        <button [class.active]="view === 'list'" (click)="view = 'list'">
          All Elections
        </button>
        <button [class.active]="view === 'create'" (click)="view = 'create'">
          Create Election
        </button>
      </div>

      <div class="card" *ngIf="view === 'list'">
        <h2>Elections</h2>
        <div *ngIf="loading">Loading...</div>
        <table *ngIf="!loading && elections.length" class="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Start</th>
              <th>End</th>
              <th>Candidates</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of elections">
              <td>
                <strong>{{ e.title }}</strong
                ><br /><small class="id-cell">{{ e.electionId }}</small>
              </td>
              <td>
                <span class="badge" [class]="'badge-' + e.status">{{
                  e.status
                }}</span>
              </td>
              <td>{{ e.startDate | date: 'shortDate' }}</td>
              <td>{{ e.endDate | date: 'shortDate' }}</td>
              <td>{{ e.candidates?.length || 0 }}</td>
              <td>
                <button (click)="viewElection(e)" class="btn-view-detail">
                  View
                </button>
                <button
                  *ngIf="e.status === 'scheduled'"
                  (click)="activate(e)"
                  class="btn-activate"
                >
                  Activate
                </button>
                <button
                  *ngIf="e.status === 'active'"
                  (click)="stop(e)"
                  class="btn-stop"
                >
                  Stop
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!loading && !elections.length" class="empty">
          No elections found.
        </div>
      </div>

      <div
        class="modal-overlay"
        *ngIf="selectedElection"
        (click)="closeModal($event)"
      >
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Election Details</h2>
            <button (click)="selectedElection = null" class="btn-close">
              &times;
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <label>Election ID</label>
                <span class="id-text">{{ selectedElection.electionId }}</span>
              </div>
              <div class="detail-item">
                <label>Status</label>
                <span
                  class="badge"
                  [class]="'badge-' + selectedElection.status"
                  >{{ selectedElection.status }}</span
                >
              </div>
              <div class="detail-item full-width">
                <label>Title</label>
                <span>{{ selectedElection.title }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedElection.description">
                <label>Description</label>
                <span>{{ selectedElection.description }}</span>
              </div>
              <div class="detail-item">
                <label>Start Date</label>
                <span>{{
                  selectedElection.startDate | date: 'mediumDate'
                }}</span>
              </div>
              <div class="detail-item">
                <label>End Date</label>
                <span>{{ selectedElection.endDate | date: 'mediumDate' }}</span>
              </div>
              <div class="detail-item full-width">
                <label
                  >Candidates ({{
                    selectedElection.candidates?.length || 0
                  }})</label
                >
                <div
                  class="candidates-list"
                  *ngIf="selectedElection.candidates?.length"
                >
                  <div
                    *ngFor="let c of selectedElection.candidates"
                    class="candidate-chip"
                  >
                    <span class="chip-name">{{ c.name }}</span>
                    <span class="chip-party" *ngIf="c.party">{{
                      c.party
                    }}</span>
                  </div>
                </div>
                <div
                  *ngIf="!selectedElection.candidates?.length"
                  class="no-candidates"
                >
                  No candidates assigned.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="view === 'create'">
        <h2>Create New Election</h2>
        <form (ngSubmit)="onSubmit()" class="form">
          <div class="form-group">
            <label>Title</label>
            <input
              type="text"
              [(ngModel)]="formData.title"
              name="title"
              required
            />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea
              [(ngModel)]="formData.description"
              name="description"
              rows="3"
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start Date</label>
              <input
                type="datetime-local"
                [(ngModel)]="formData.startDate"
                name="startDate"
                required
              />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input
                type="datetime-local"
                [(ngModel)]="formData.endDate"
                name="endDate"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <label
              >Select Candidates ({{
                selectedCandidates.length
              }}
              selected)</label
            >
            <div class="candidates-list">
              <div
                *ngFor="let c of allCandidates"
                [class.candidate-card]="true"
                [class.selected]="isCandidateSelected(c.candidateId)"
                (click)="toggleCandidate(c.candidateId)"
              >
                <div
                  class="checkbox"
                  [class.checked]="isCandidateSelected(c.candidateId)"
                >
                  {{ isCandidateSelected(c.candidateId) ? '✓' : '' }}
                </div>
                <div class="candidate-info">
                  <div class="candidate-name">{{ c.name }}</div>
                  <div class="candidate-party" *ngIf="c.party">
                    {{ c.party }}
                  </div>
                  <div class="candidate-desc" *ngIf="c.description">
                    {{ c.description }}
                  </div>
                </div>
              </div>
            </div>
            <div *ngIf="!allCandidates.length" class="empty-candidates">
              No candidates registered. Go to
              <a routerLink="/voting/candidates">Manage Candidates</a>
              to add candidates first.
            </div>
          </div>
          <button
            type="submit"
            [disabled]="
              loading ||
              !formData.title ||
              !formData.startDate ||
              !formData.endDate ||
              selectedCandidates.length === 0
            "
            class="btn-primary"
          >
            {{ loading ? 'Creating...' : 'Create Election' }}
          </button>
        </form>
        <div *ngIf="result" class="result success">
          <div class="result-content">
            <strong>Election created successfully!</strong>
            <div class="election-id">
              ID: {{ result.data?.electionId || result.electionId }}
            </div>
          </div>
          <div class="result-actions">
            <a [routerLink]="['/voting/results']" class="btn-view"
              >View Results</a
            >
            <button (click)="switchToList()" class="btn-view">
              View All Elections
            </button>
          </div>
        </div>
        <div *ngIf="error" class="error">{{ error }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .elections-page h2 {
        margin: 0 0 1rem;
        color: #1a1a2e;
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
      }
      .tabs button.active {
        background: #4361ee;
        color: white;
        border-color: #4361ee;
      }
      .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
        font-size: 0.75rem;
        color: #888;
      }
      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
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
      .badge-cancelled {
        background: #fee2e2;
        color: #991b1b;
      }
      .btn-activate {
        padding: 0.4rem 0.8rem;
        background: #2ecc71;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-stop {
        padding: 0.4rem 0.8rem;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-view-detail {
        padding: 0.4rem 0.8rem;
        background: #4361ee;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        margin-right: 0.4rem;
      }
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 2rem;
      }
      .modal {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f0f0f0;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.2rem;
        color: #1a1a2e;
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
      .modal-body {
        padding: 1.5rem;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }
      .detail-item {
        display: flex;
        flex-direction: column;
      }
      .detail-item.full-width {
        grid-column: 1 / -1;
      }
      .detail-item label {
        font-size: 0.75rem;
        color: #888;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
      }
      .id-text {
        font-family: monospace;
        font-size: 0.85rem;
        color: #4361ee;
      }
      .candidates-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .candidate-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.8rem;
        background: #f0f2f5;
        border-radius: 20px;
        font-size: 0.85rem;
      }
      .chip-name {
        font-weight: 600;
        color: #1a1a2e;
      }
      .chip-party {
        color: #666;
        font-size: 0.8rem;
      }
      .no-candidates {
        color: #999;
        font-size: 0.85rem;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 700px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
      }
      .form-row {
        display: flex;
        gap: 1rem;
      }
      .form-row .form-group {
        flex: 1;
      }
      label {
        font-size: 0.85rem;
        font-weight: 500;
        color: #555;
        margin-bottom: 0.3rem;
      }
      input,
      textarea {
        padding: 0.65rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.95rem;
        font-family: inherit;
      }
      input:focus,
      textarea:focus {
        outline: none;
        border-color: #4361ee;
      }
      .candidates-list-scroll {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 0.5rem;
      }
      .candidate-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .candidate-card:hover {
        border-color: #4361ee;
      }
      .candidate-card.selected {
        border-color: #4361ee;
        background: #e0e7ff;
      }
      .checkbox {
        width: 24px;
        height: 24px;
        border: 2px solid #ccc;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        flex-shrink: 0;
      }
      .checkbox.checked {
        background: #4361ee;
        border-color: #4361ee;
      }
      .candidate-info {
        flex: 1;
      }
      .candidate-name {
        font-weight: 600;
        color: #1a1a2e;
      }
      .candidate-party {
        font-size: 0.85rem;
        color: #666;
      }
      .candidate-desc {
        font-size: 0.8rem;
        color: #888;
        margin-top: 0.25rem;
      }
      .empty-candidates {
        text-align: center;
        padding: 1rem;
        color: #888;
      }
      .empty-candidates a {
        color: #4361ee;
        cursor: pointer;
      }
      .btn-primary {
        padding: 0.75rem;
        background: #4361ee;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .result {
        padding: 0.75rem;
        border-radius: 6px;
        margin-top: 1rem;
      }
      .result.success {
        background: #d1fae5;
        color: #065f46;
      }
      .result-content {
        margin-bottom: 0.5rem;
      }
      .result-content strong {
        display: block;
        font-size: 1rem;
        margin-bottom: 0.25rem;
      }
      .election-id {
        font-family: monospace;
        font-size: 0.8rem;
        opacity: 0.8;
      }
      .result-actions {
        display: flex;
        gap: 0.5rem;
      }
      .btn-view {
        padding: 0.4rem 1rem;
        background: #065f46;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        text-decoration: none;
        text-align: center;
      }
      .error {
        background: #fee2e2;
        color: #dc2626;
        padding: 0.75rem;
        border-radius: 6px;
        margin-top: 1rem;
      }
      .empty {
        color: #999;
        text-align: center;
        padding: 2rem;
      }
    `,
  ],
})
export class ManageElectionsComponent implements OnInit {
  view = 'list';
  elections: Election[] = [];
  allCandidates: Candidate[] = [];
  selectedCandidates: string[] = [];
  selectedElection: Election | null = null;
  loading = false;
  formData = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  };
  result: any = null;
  error = '';

  constructor(
    private votingService: VotingService,
    private candidateService: CandidateService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadElections();
    this.loadCandidates();
  }

  loadElections() {
    this.loading = true;
    this.votingService.getAllElections().subscribe({
      next: (res) => {
        this.elections = res;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  loadCandidates() {
    this.candidateService.getAllCandidates().subscribe({
      next: (candidates) => {
        this.allCandidates = candidates;
      },
      error: () => {},
    });
  }

  activate(election: Election) {
    this.votingService.activateElection(election.electionId).subscribe({
      next: () => this.loadElections(),
      error: () => {},
    });
  }

  stop(election: Election) {
    if (
      !confirm(
        `Stop election "${election.title}"? No more votes will be accepted.`,
      )
    )
      return;
    this.votingService.stopElection(election.electionId).subscribe({
      next: () => this.loadElections(),
      error: () => {},
    });
  }

  isCandidateSelected(candidateId: string): boolean {
    return this.selectedCandidates.includes(candidateId);
  }

  toggleCandidate(candidateId: string) {
    const idx = this.selectedCandidates.indexOf(candidateId);
    if (idx >= 0) this.selectedCandidates.splice(idx, 1);
    else this.selectedCandidates.push(candidateId);
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.result = null;
    this.votingService
      .createElection({
        title: this.formData.title,
        description: this.formData.description,
        startDate: this.formData.startDate,
        endDate: this.formData.endDate,
        candidateIds: this.selectedCandidates,
      })
      .subscribe({
        next: (res) => {
          this.result = res;
          this.loading = false;
          this.formData = {
            title: '',
            description: '',
            startDate: '',
            endDate: '',
          };
          this.selectedCandidates = [];
          this.loadElections();
          this.view = 'list';
        },
        error: () => {
          this.error = 'Failed to create election';
          this.loading = false;
        },
      });
  }

  switchToList() {
    this.view = 'list';
  }

  viewElection(election: Election) {
    this.selectedElection = election;
  }

  closeModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.selectedElection = null;
    }
  }
}
