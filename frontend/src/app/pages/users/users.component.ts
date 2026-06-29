import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user-company.service';
import { CompanyService } from '../../services/user-company.service';
import { Company } from '../../models/company.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <div class="card">
        <h2>Create New User</h2>
        <form (ngSubmit)="onSubmit()" class="form-grid">
          <div class="form-group">
            <label>Name</label>
            <input
              type="text"
              [(ngModel)]="formData.name"
              name="name"
              required
            />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input
              type="email"
              [(ngModel)]="formData.email"
              name="email"
              required
            />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input
              type="password"
              [(ngModel)]="formData.password"
              name="password"
              required
            />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select [(ngModel)]="formData.role" name="role" required>
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="super-admin">Super Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label>Company ID</label>
            <input
              type="text"
              [(ngModel)]="formData.associatedCompany"
              name="associatedCompany"
              required
              placeholder="Company ObjectId"
            />
          </div>
          <div class="form-group full-width">
            <button type="submit" [disabled]="loading" class="btn-primary">
              {{ loading ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </form>
        <div *ngIf="success" class="success">User created successfully!</div>
        <div *ngIf="error" class="error">{{ error }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .users-page h2 {
        margin: 0 0 1rem;
        color: #1a1a2e;
      }
      .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        max-width: 600px;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .form-group {
        display: flex;
        flex-direction: column;
      }
      .form-group.full-width {
        grid-column: 1 / -1;
      }
      label {
        font-size: 0.85rem;
        font-weight: 500;
        color: #555;
        margin-bottom: 0.3rem;
      }
      input,
      select {
        padding: 0.65rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      input:focus,
      select:focus {
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
export class UsersComponent {
  formData = {
    name: '',
    email: '',
    password: '',
    role: 'read',
    associatedCompany: '',
  };
  loading = false;
  success = false;
  error = '';

  constructor(private userService: UserService) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.success = false;
    this.userService.createUser(this.formData).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.formData = {
          name: '',
          email: '',
          password: '',
          role: 'read',
          associatedCompany: '',
        };
      },
      error: () => {
        this.error = 'Failed to create user';
        this.loading = false;
      },
    });
  }
}
