import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>Voting System</h1>
        <p class="subtitle">Sign in to continue</p>
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Email</label>
            <input
              type="email"
              id="username"
              [(ngModel)]="credentials.username"
              name="username"
              required
              placeholder="Enter your email"
            />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="credentials.password"
              name="password"
              required
              placeholder="Enter your password"
            />
          </div>
          <div *ngIf="error" class="error">{{ error }}</div>
          <button type="submit" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f2f5;
      }
      .login-card {
        background: white;
        padding: 2.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
      }
      h1 {
        margin: 0 0 0.5rem;
        color: #1a1a2e;
        font-size: 1.8rem;
        text-align: center;
      }
      .subtitle {
        color: #666;
        margin: 0 0 2rem;
        text-align: center;
      }
      .form-group {
        margin-bottom: 1.25rem;
      }
      label {
        display: block;
        margin-bottom: 0.4rem;
        font-weight: 500;
        color: #333;
        font-size: 0.9rem;
      }
      input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 1rem;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      input:focus {
        outline: none;
        border-color: #4361ee;
      }
      .btn-primary {
        width: 100%;
        padding: 0.85rem;
        background: #4361ee;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .btn-primary:hover:not(:disabled) {
        background: #3a56d4;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        background: #fee2e2;
        color: #dc2626;
        padding: 0.75rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.authService.setToken(res.jwt);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.error = 'Invalid credentials. Please try again.';
        this.loading = false;
      },
    });
  }
}
