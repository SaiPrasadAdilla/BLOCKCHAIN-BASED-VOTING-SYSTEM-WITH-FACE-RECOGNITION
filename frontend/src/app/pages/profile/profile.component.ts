import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-page">
      <h1>Profile</h1>
      <div *ngIf="profile" class="profile-card">
        <div class="info-row">
          <span class="label">Email</span>
          <span class="value">{{ profile.username }}</span>
        </div>
        <div class="info-row">
          <span class="label">Role</span>
          <span class="value"
            ><span class="badge">{{ profile.role }}</span></span
          >
        </div>
        <div class="info-row">
          <span class="label">Company</span>
          <span class="value">{{ profile.associatedCompany }}</span>
        </div>
      </div>
      <div *ngIf="loading">Loading profile...</div>
      <div *ngIf="error && !profile" class="error">{{ error }}</div>
    </div>
  `,
  styles: [
    `
      .profile-page h1 {
        margin: 0 0 1.5rem;
        color: #1a1a2e;
      }
      .profile-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        max-width: 500px;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 1rem 0;
        border-bottom: 1px solid #f0f0f0;
      }
      .info-row:last-child {
        border-bottom: none;
      }
      .label {
        color: #666;
        font-weight: 500;
      }
      .value {
        color: #1a1a2e;
        font-weight: 600;
      }
      .badge {
        background: #e0e7ff;
        color: #4361ee;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
      }
      .error {
        color: #dc2626;
        background: #fee2e2;
        padding: 1rem;
        border-radius: 8px;
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  profile: any;
  loading = false;
  error = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.profile = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load profile';
        this.loading = false;
      },
    });
  }
}
