import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VotingService } from '../../../services/voting.service';
import { CandidateService } from '../../../services/candidate.service';
import { Election } from '../../../models/voting.model';

@Component({
  selector: 'app-cast-vote',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cast-vote-page">
      <div class="card">
        <h2>Cast Your Vote</h2>
        <form (ngSubmit)="onSubmit()" class="form">
          <div class="form-group">
            <label>Select Election</label>
            <select
              [(ngModel)]="formData.electionId"
              name="electionId"
              (change)="onElectionChange()"
              required
            >
              <option value="">-- Select an election --</option>
              <option *ngFor="let e of elections" [value]="e.electionId">
                {{ e.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Voter ID</label>
            <input
              type="text"
              [(ngModel)]="formData.voterId"
              name="voterId"
              required
              placeholder="Enter your voter ID"
            />
          </div>
          <div class="form-group" *ngIf="candidates.length">
            <label>Select Candidate</label>
            <div class="candidates-grid">
              <div
                *ngFor="let c of candidates; let idx = index"
                [class.candidate-card]="true"
                [class.selected]="selectedIdx === idx"
                (click)="selectCandidate(idx, c)"
              >
                <div class="candidate-name">{{ c.name }}</div>
                <div class="candidate-party" *ngIf="c.party">{{ c.party }}</div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Face Verification</label>
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
                  class="btn-capture btn-primary"
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
          <button
            type="submit"
            [disabled]="
              loading ||
              !formData.electionId ||
              !formData.voterId ||
              !formData.candidateId ||
              !capturedImage
            "
            class="btn-primary"
          >
            {{ loading ? 'Casting vote...' : 'Cast Vote' }}
          </button>
        </form>
        <div
          *ngIf="result"
          [class]="result.success ? 'result success' : 'result error'"
        >
          <strong *ngIf="result.success">Vote cast successfully!</strong>
          <strong *ngIf="!result.success">{{
            result.message || 'Vote failed'
          }}</strong>
          <div *ngIf="result.success && result.data">
            <div>
              Vote ID: <strong>{{ result.data.voteId }}</strong>
            </div>
            <div>Status: {{ result.data.status }}</div>
            <div *ngIf="result.data.faceVerificationPassed">
              Face verified ({{
                (result.data.faceVerificationSimilarity * 100).toFixed(1)
              }}%)
            </div>
            <div *ngIf="result.data.blockchainTxHash">
              TX: {{ result.data.blockchainTxHash }}
            </div>
          </div>
          <div *ngIf="result.error" class="error-detail">
            {{ result.error }}
          </div>
        </div>
        <div *ngIf="httpError" class="error">{{ httpError }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .cast-vote-page h2 {
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
      .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
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
      select,
      input[type='text'] {
        padding: 0.65rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      select:focus,
      input[type='text']:focus {
        outline: none;
        border-color: #4361ee;
      }
      .candidates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.75rem;
      }
      .candidate-card {
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 1rem;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;
      }
      .candidate-card:hover {
        border-color: #4361ee;
      }
      .candidate-card.selected {
        border-color: #4361ee;
        background: #e0e7ff;
      }
      .candidate-name {
        font-weight: 600;
        color: #1a1a2e;
      }
      .candidate-party {
        font-size: 0.85rem;
        color: #666;
        margin-top: 0.25rem;
      }
      .webcam-container {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        background: #000;
        min-height: 240px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      video {
        width: 100%;
        max-height: 320px;
        object-fit: cover;
        border-radius: 8px;
      }
      video.hidden {
        display: none;
      }
      .captured-preview {
        width: 100%;
        max-height: 320px;
        object-fit: cover;
        border-radius: 8px;
      }
      .webcam-placeholder {
        width: 100%;
        height: 240px;
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
      .result.error {
        background: #fee2e2;
        color: #dc2626;
      }
      .error-detail {
        font-size: 0.85rem;
        margin-top: 0.5rem;
        opacity: 0.8;
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
export class CastVoteComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  elections: Election[] = [];
  candidates: any[] = [];
  selectedElection: Election | null = null;
  formData = { electionId: '', voterId: '', candidateId: '' };
  selectedIdx: number = -1;
  loading = false;
  result: any = null;
  httpError = '';

  cameraActive = false;
  capturedImage: string | null = null;
  capturedBlob: Blob | null = null;
  stream: MediaStream | null = null;
  allCandidatesMap: Map<string, string> = new Map();

  constructor(
    private votingService: VotingService,
    private candidateService: CandidateService,
  ) {}

  ngOnInit() {
    this.votingService.getActiveElections().subscribe({
      next: (res) => (this.elections = res),
      error: () => {},
    });
    this.candidateService.getAllCandidates().subscribe({
      next: (candidates) => {
        candidates.forEach((c: any) => {
          this.allCandidatesMap.set(c.name.toLowerCase(), c.candidateId);
        });
      },
      error: () => {},
    });
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  selectCandidate(idx: number, candidate: any) {
    this.selectedIdx = idx;
    const cid =
      candidate.candidateId ||
      this.allCandidatesMap.get(candidate.name?.toLowerCase());
    this.formData.candidateId = cid || '';
  }

  onElectionChange() {
    this.selectedElection =
      this.elections.find((e) => e.electionId === this.formData.electionId) ||
      null;
    this.formData.candidateId = '';
    this.selectedIdx = -1;
    this.candidates = [];
    if (this.selectedElection && this.selectedElection.candidates) {
      this.candidates = this.selectedElection.candidates;
    }
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
      this.capturedBlob = null;
    } catch (err) {
      this.httpError =
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
    this.capturedBlob = this.dataUrlToBlob(dataUrl);
    this.stopCamera();
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)![1];
    const byteChars = atob(base64);
    const byteArr = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArr[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteArr)], { type: mime });
  }

  retakeImage() {
    this.capturedImage = null;
    this.capturedBlob = null;
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

  onSubmit() {
    if (!this.capturedBlob) return;
    this.loading = true;
    this.httpError = '';
    this.result = null;
    this.votingService
      .castVote(
        this.formData.electionId,
        this.formData.voterId,
        this.formData.candidateId,
        this.capturedBlob,
      )
      .subscribe({
        next: (res) => {
          this.result = res;
          this.loading = false;
        },
        error: (err) => {
          this.httpError = err?.error?.message || 'Failed to cast vote';
          this.loading = false;
        },
      });
  }
}
