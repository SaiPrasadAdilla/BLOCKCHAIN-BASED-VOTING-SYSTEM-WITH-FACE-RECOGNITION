import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaceRecognitionService } from '../../services/facial-recognition.service';

@Component({
  selector: 'app-facial-recognition',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="face-page">
      <div class="card">
        <h2>Register Face for User</h2>
        <div class="form-row">
          <div class="form-group">
            <label>User ID</label>
            <input
              type="text"
              [(ngModel)]="registerUserId"
              placeholder="Enter user ID"
            />
          </div>
          <div class="form-group">
            <label>Face Image</label>
            <input
              type="file"
              (change)="onFileSelect($event, 'register')"
              accept="image/*"
            />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button
              (click)="registerFace()"
              [disabled]="!registerUserId || !registerFile"
              class="btn-primary"
            >
              Register
            </button>
          </div>
        </div>
        <div *ngIf="registerResult" class="result success">
          {{ registerResult }}
        </div>
      </div>

      <div class="card">
        <h2>Verify Face</h2>
        <div class="form-row">
          <div class="form-group">
            <label>User ID</label>
            <input
              type="text"
              [(ngModel)]="verifyUserId"
              placeholder="Enter user ID"
            />
          </div>
          <div class="form-group">
            <label>Face Image</label>
            <input
              type="file"
              (change)="onFileSelect($event, 'verify')"
              accept="image/*"
            />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button
              (click)="verifyFace()"
              [disabled]="!verifyUserId || !verifyFile"
              class="btn-primary"
            >
              Verify
            </button>
          </div>
        </div>
        <div *ngIf="verifyResult" class="result-box">
          <div
            class="result"
            [class.pass]="verifyResult.verified"
            [class.fail]="!verifyResult.verified"
          >
            {{ verifyResult.verified ? 'VERIFIED' : 'NOT VERIFIED' }}
            <span *ngIf="verifyResult.similarity">
              (Similarity:
              {{ (verifyResult.similarity * 100).toFixed(1) }}%)</span
            >
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Authenticate by Face</h2>
        <div class="form-row">
          <div class="form-group">
            <label>Face Image</label>
            <input
              type="file"
              (change)="onFileSelect($event, 'auth')"
              accept="image/*"
            />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button
              (click)="authenticateFace()"
              [disabled]="!authFile"
              class="btn-primary"
            >
              Authenticate
            </button>
          </div>
        </div>
        <div *ngIf="authResult" class="result-box">
          <div
            class="result"
            [class.pass]="authResult.verified"
            [class.fail]="!authResult.verified"
          >
            {{
              authResult.verified
                ? 'MATCHED: ' + authResult.matchedUserId
                : 'NO MATCH FOUND'
            }}
            <span *ngIf="authResult.similarity">
              (Similarity:
              {{ (authResult.similarity * 100).toFixed(1) }}%)</span
            >
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Detect Face</h2>
        <div class="form-row">
          <div class="form-group">
            <label>Image</label>
            <input
              type="file"
              (change)="onFileSelect($event, 'detect')"
              accept="image/*"
            />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button
              (click)="detectFace()"
              [disabled]="!detectFile"
              class="btn-primary"
            >
              Detect
            </button>
          </div>
        </div>
        <div *ngIf="detectResult" class="result-box">
          <pre>{{ detectResult | json }}</pre>
        </div>
      </div>

      <div class="card">
        <h2>Check Face Info</h2>
        <div class="form-row">
          <div class="form-group">
            <label>User ID</label>
            <input
              type="text"
              [(ngModel)]="infoUserId"
              placeholder="Enter user ID"
            />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button
              (click)="getFaceInfo()"
              [disabled]="!infoUserId"
              class="btn-primary"
            >
              Check
            </button>
          </div>
        </div>
        <div *ngIf="faceInfo" class="result-box">
          <div>
            <strong>Registered:</strong> {{ faceInfo.exists ? 'Yes' : 'No' }}
          </div>
          <div *ngIf="faceInfo.imagePath">
            <strong>Image:</strong> {{ faceInfo.imagePath }}
          </div>
          <div *ngIf="faceInfo.registeredAt">
            <strong>Registered:</strong> {{ faceInfo.registeredAt }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .face-page h2 {
        margin: 0 0 1rem;
        color: #1a1a2e;
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
      input[type='text'] {
        padding: 0.65rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      input[type='file'] {
        font-size: 0.9rem;
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
      .result-box {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
      }
      .result-box pre {
        margin: 0;
        font-size: 0.85rem;
      }
      .result {
        font-weight: 600;
        font-size: 1.1rem;
      }
      .result.pass {
        color: #2ecc71;
      }
      .result.fail {
        color: #e74c3c;
      }
      .result.success {
        background: #d1fae5;
        color: #065f46;
        padding: 0.75rem;
        border-radius: 6px;
      }
    `,
  ],
})
export class FacialRecognitionComponent {
  registerUserId = '';
  registerFile: File | null = null;
  registerResult = '';

  verifyUserId = '';
  verifyFile: File | null = null;
  verifyResult: any = null;

  authFile: File | null = null;
  authResult: any = null;

  detectFile: File | null = null;
  detectResult: any = null;

  infoUserId = '';
  faceInfo: any = null;

  constructor(private faceService: FaceRecognitionService) {}

  onFileSelect(event: Event, type: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (type === 'register') this.registerFile = file;
    if (type === 'verify') this.verifyFile = file;
    if (type === 'auth') this.authFile = file;
    if (type === 'detect') this.detectFile = file;
  }

  registerFace() {
    if (this.registerUserId && this.registerFile) {
      this.faceService
        .registerFace(this.registerUserId, this.registerFile)
        .subscribe({
          next: () => {
            this.registerResult = 'Face registered successfully!';
          },
          error: () => {
            this.registerResult = 'Failed to register face';
          },
        });
    }
  }

  verifyFace() {
    if (this.verifyUserId && this.verifyFile) {
      this.faceService
        .verifyFace(this.verifyUserId, this.verifyFile)
        .subscribe({
          next: (res) => (this.verifyResult = res),
          error: () => (this.verifyResult = { verified: false, similarity: 0 }),
        });
    }
  }

  authenticateFace() {
    if (this.authFile) {
      this.faceService.authenticateWithFace(this.authFile).subscribe({
        next: (res) => (this.authResult = res),
        error: () => (this.authResult = { verified: false }),
      });
    }
  }

  detectFace() {
    if (this.detectFile) {
      this.faceService.detectFace(this.detectFile).subscribe({
        next: (res) => (this.detectResult = res),
        error: (err) => (this.detectResult = { error: err.message }),
      });
    }
  }

  getFaceInfo() {
    if (this.infoUserId) {
      this.faceService.getFaceInfo(this.infoUserId).subscribe({
        next: (res) => (this.faceInfo = res),
        error: () => (this.faceInfo = { exists: false }),
      });
    }
  }
}
