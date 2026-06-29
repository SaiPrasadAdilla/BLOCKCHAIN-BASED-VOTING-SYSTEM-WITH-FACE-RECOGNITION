import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../services/user-company.service';
import { Company } from '../../models/company.model';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="companies-page">
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ companies.length }}</div>
          <div class="stat-label">Total Companies</div>
        </div>
      </div>
      <div class="card">
        <h2>Create Company</h2>
        <form (ngSubmit)="onCreate()" class="form-row">
          <div class="form-group">
            <label>Company Name</label>
            <input
              type="text"
              [(ngModel)]="newCompany.companyName"
              name="companyName"
              required
            />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button type="submit" [disabled]="loading" class="btn-primary">
              {{ loading ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
        <div *ngIf="success" class="success">Company created!</div>
        <div *ngIf="error" class="error">{{ error }}</div>
      </div>
      <div class="card">
        <h2>All Companies</h2>
        <div *ngIf="loadingList">Loading...</div>
        <table *ngIf="!loadingList && companies.length" class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created On</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of companies">
              <td>{{ c.companyName }}</td>
              <td>{{ c.createdOn | date: 'medium' }}</td>
              <td class="id-cell">{{ c._id }}</td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="!loadingList && !companies.length" class="empty">
          No companies found.
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .companies-page h2 {
        margin: 0 0 1rem;
        color: #1a1a2e;
      }
      .stats-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem 2rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }
      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #4361ee;
      }
      .stat-label {
        color: #666;
        font-size: 0.85rem;
      }
      .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;
      }
      .form-row {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
      }
      .form-group {
        display: flex;
        flex-direction: column;
      }
      .form-group:first-child {
        flex: 1;
      }
      label {
        font-size: 0.85rem;
        font-weight: 500;
        color: #555;
        margin-bottom: 0.3rem;
      }
      input {
        padding: 0.65rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      input:focus {
        outline: none;
        border-color: #4361ee;
      }
      .btn-primary {
        padding: 0.65rem 1.5rem;
        background: #4361ee;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
        font-size: 0.85rem;
        text-transform: uppercase;
      }
      .id-cell {
        font-family: monospace;
        font-size: 0.8rem;
        color: #888;
      }
      .empty {
        color: #999;
        text-align: center;
        padding: 2rem;
      }
      .success {
        background: #d1fae5;
        color: #065f46;
        padding: 0.75rem;
        border-radius: 6px;
        margin-top: 1rem;
      }
      .error {
        background: #fee2e2;
        color: #dc2626;
        padding: 0.75rem;
        border-radius: 6px;
        margin-top: 1rem;
      }
    `,
  ],
})
export class CompaniesComponent implements OnInit {
  companies: Company[] = [];
  newCompany = { companyName: '', createdOn: new Date().toISOString() };
  loading = false;
  loadingList = false;
  success = false;
  error = '';

  constructor(private companyService: CompanyService) {}

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.loadingList = true;
    this.companyService.getAllCompanies().subscribe({
      next: (res) => {
        this.companies = res;
        this.loadingList = false;
      },
      error: () => (this.loadingList = false),
    });
  }

  onCreate() {
    this.loading = true;
    this.error = '';
    this.success = false;
    this.companyService.createCompany(this.newCompany).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.newCompany = {
          companyName: '',
          createdOn: new Date().toISOString(),
        };
        this.loadCompanies();
      },
      error: () => {
        this.error = 'Failed to create company';
        this.loading = false;
      },
    });
  }
}
