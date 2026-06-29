import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidateService } from '../../../services/candidate.service';
import { Candidate } from '../../../models/voting.model';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="candidates-page">
      <div class="tabs">
        <button [class.active]="view === 'list'" (click)="view = 'list'">
          All Candidates
        </button>
        <button [class.active]="view === 'create'" (click)="view = 'create'">
          Add Candidate
        </button>
      </div>

      <div class="card" *ngIf="view === 'list'">
        <h2>Candidates</h2>
        <div *ngIf="loading">Loading...</div>
        <div *ngIf="!loading && candidates.length" class="candidates-grid">
          <div *ngFor="let c of candidates" class="candidate-card">
            <div class="candidate-header">
              <div class="candidate-name">{{ c.name }}</div>
              <span class="badge">{{ c.party }}</span>
            </div>
            <div class="candidate-desc" *ngIf="c.description">
              {{ c.description }}
            </div>
            <div class="candidate-manifesto" *ngIf="c.manifesto">
              {{ c.manifesto }}
            </div>
            <div class="candidate-footer">
              <button
                (click)="deleteCandidate(c.candidateId)"
                class="btn-delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        <div *ngIf="!loading && !candidates.length" class="empty">
          No candidates registered yet.
        </div>
      </div>

      <div class="card" *ngIf="view === 'create'">
        <h2>Register New Candidate</h2>
        <form (ngSubmit)="onSubmit()" class="form">
          <div class="form-group">
            <label>Name</label>
            <input
              type="text"
              [(ngModel)]="formData.name"
              name="name"
              required
              placeholder="Candidate full name"
            />
          </div>
          <div class="form-group">
            <label>Party</label>
            <input
              type="text"
              [(ngModel)]="formData.party"
              name="party"
              required
              placeholder="Political party or affiliation"
            />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea
              [(ngModel)]="formData.description"
              name="description"
              rows="2"
              placeholder="Brief description"
            ></textarea>
          </div>
          <div class="form-group">
            <label>Manifesto</label>
            <textarea
              [(ngModel)]="formData.manifesto"
              name="manifesto"
              rows="4"
              placeholder="Candidate's manifesto or platform"
            ></textarea>
          </div>
          <button
            type="submit"
            [disabled]="loading || !formData.name || !formData.party"
            class="btn-primary"
          >
            {{ loading ? 'Registering...' : 'Register Candidate' }}
          </button>
        </form>
        <div *ngIf="result" class="result success">
          Candidate registered! ID: {{ result.candidateId }}
        </div>
        <div *ngIf="error" class="error">{{ error }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .candidates-page h2 {
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
      .candidates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
      }
      .candidate-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1rem;
        transition: box-shadow 0.2s;
      }
      .candidate-card:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }
      .candidate-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
      }
      .candidate-name {
        font-weight: 600;
        font-size: 1.1rem;
        color: #1a1a2e;
      }
      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
        background: #e0e7ff;
        color: #3730a3;
      }
      .candidate-desc {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.5rem;
      }
      .candidate-manifesto {
        font-size: 0.8rem;
        color: #888;
        font-style: italic;
        margin-bottom: 0.5rem;
      }
      .candidate-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid #f0f0f0;
      }
      .btn-delete {
        padding: 0.3rem 0.6rem;
        background: #fee2e2;
        color: #dc2626;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-delete:hover {
        background: #fecaca;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 500px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
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
export class CandidatesComponent implements OnInit {
  view = 'list';
  candidates: Candidate[] = [];
  loading = false;
  formData = {
    name: '',
    party: '',
    description: '',
    manifesto: '',
  };
  result: any = null;
  error = '';

  constructor(private candidateService: CandidateService) {}

  ngOnInit() {
    this.loadCandidates();
  }

  loadCandidates() {
    this.loading = true;
    this.candidateService.getAllCandidates().subscribe({
      next: (candidates) => {
        this.candidates = candidates;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  deleteCandidate(candidateId: string) {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    this.candidateService.deleteCandidate(candidateId).subscribe({
      next: () => this.loadCandidates(),
      error: () => {},
    });
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.result = null;
    this.candidateService
      .registerCandidate({
        name: this.formData.name,
        party: this.formData.party,
        description: this.formData.description || undefined,
        manifesto: this.formData.manifesto || undefined,
      })
      .subscribe({
        next: (res) => {
          this.result = res;
          this.loading = false;
          this.formData = {
            name: '',
            party: '',
            description: '',
            manifesto: '',
          };
          this.loadCandidates();
        },
        error: () => {
          this.error = 'Failed to register candidate';
          this.loading = false;
        },
      });
  }
}
