import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VotingService } from '../../../services/voting.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="register-page">
      <div class="card">
        <h2>Register New Voter</h2>
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
          <div class="form-group full-width">
            <label>Face Capture *</label>
            <div class="webcam-container">
              <video
                #videoElement
                *ngIf="!capturedImage"
                autoplay
                playsinline
                [class.hidden]="!cameraActive"
              ></video>
              <img
                *ngIf="capturedImage"
                [src]="capturedImage"
                alt="Captured face"
                class="captured-preview"
              />
              <div
                *ngIf="!cameraActive && !capturedImage"
                class="webcam-placeholder"
              >
                Camera not active
              </div>
              <div class="webcam-controls">
                <button
                  type="button"
                  (click)="startCamera()"
                  *ngIf="!cameraActive && !capturedImage"
                  class="btn-capture"
                >
                  Start Camera
                </button>
                <button
                  type="button"
                  (click)="captureImage()"
                  *ngIf="cameraActive && !capturedImage"
                  class="btn-capture btn-primary-sm"
                >
                  Capture Face
                </button>
                <button
                  type="button"
                  (click)="retakeImage()"
                  *ngIf="capturedImage"
                  class="btn-capture"
                >
                  Retake
                </button>
                <button
                  type="button"
                  (click)="stopCamera()"
                  *ngIf="cameraActive"
                  class="btn-capture btn-danger"
                >
                  Stop Camera
                </button>
              </div>
            </div>
          </div>
          <div class="form-group full-width">
            <label>Documents (optional)</label>
            <input
              type="file"
              (change)="onDocsSelect($event)"
              accept="image/*,.pdf"
              multiple
            />
          </div>
          <div class="form-group full-width">
            <button
              type="submit"
              [disabled]="
                loading || !formData.name || !formData.email || !faceCaptured
              "
              class="btn-primary"
            >
              {{ loading ? 'Registering...' : 'Register Voter' }}
            </button>
          </div>
        </form>
        <div *ngIf="result && result.success" class="result success">
          Voter registered! Voter ID: <strong>{{ result.data.voterId }}</strong>
          <div *ngIf="result.data.blockchainTxHash">
            TX: {{ result.data.blockchainTxHash }}
          </div>
        </div>
        <div *ngIf="result && !result.success" class="error">
          {{ result.message || result.error || 'Registration failed' }}
        </div>
        <div *ngIf="error" class="error">{{ error }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .register-page h2 {
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
      input[type='text'],
      input[type='email'] {
        padding: 0.65rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      input[type='text']:focus,
      input[type='email']:focus {
        outline: none;
        border-color: #4361ee;
      }
      input[type='file'] {
        font-size: 0.9rem;
      }
      .webcam-container {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        background: #000;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      video {
        width: 100%;
        max-height: 280px;
        object-fit: cover;
        border-radius: 8px;
      }
      video.hidden {
        display: none;
      }
      .captured-preview {
        width: 100%;
        max-height: 280px;
        object-fit: cover;
        border-radius: 8px;
      }
      .webcam-placeholder {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #888;
        font-size: 0.9rem;
      }
      .webcam-controls {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem;
        width: 100%;
        justify-content: center;
      }
      .btn-capture {
        padding: 0.5rem 1rem;
        background: #555;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .btn-capture:hover {
        background: #666;
      }
      .btn-danger {
        background: #e74c3c;
      }
      .btn-danger:hover {
        background: #c0392b;
      }
      .btn-primary-sm {
        padding: 0.5rem 1rem;
        background: #4361ee;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-primary-sm:hover {
        background: #3651d4;
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
        background: #d1fae5;
        color: #065f46;
        padding: 0.75rem;
        border-radius: 6px;
        margin-top: 1rem;
        word-break: break-all;
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
export class RegisterComponent implements OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  formData = { name: '', email: '' };
  faceFile: File | null = null;
  docFiles: File[] = [];
  loading = false;
  result: any = null;
  error = '';

  cameraActive = false;
  capturedImage: string | null = null;
  stream: MediaStream | null = null;

  faceCaptured = false;

  constructor(private votingService: VotingService) {}

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
      }
      this.cameraActive = true;
      this.capturedImage = null;
      this.faceFile = null;
      this.faceCaptured = false;
    } catch {
      this.error =
        'Camera access denied. Please allow camera access and try again.';
    }
  }

  captureImage() {
    if (!this.videoElement || !this.stream) return;
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    this.capturedImage = dataUrl;

    try {
      const binaryStr = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      this.faceFile = new File([bytes], 'capture.jpg', { type: 'image/jpeg' });
      this.faceCaptured = true;
    } catch {
      this.error = 'Failed to process captured image';
      this.capturedImage = null;
      this.faceCaptured = false;
    }

    this.stopCamera();
  }

  retakeImage() {
    this.capturedImage = null;
    this.faceFile = null;
    this.faceCaptured = false;
    this.startCamera();
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
    this.cameraActive = false;
  }

  onDocsSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    this.docFiles = input.files ? Array.from(input.files) : [];
  }

  onSubmit() {
    if (!this.faceFile) return;
    this.loading = true;
    this.error = '';
    this.result = null;
    this.votingService
      .registerVoter(
        this.formData.name,
        this.formData.email,
        this.faceFile,
        this.docFiles.length ? this.docFiles : undefined,
      )
      .subscribe({
        next: (res) => {
          this.result = res;
          this.loading = false;
        },
        error: (err) => {
          this.error =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Failed to register voter';
          this.loading = false;
        },
      });
  }
}
