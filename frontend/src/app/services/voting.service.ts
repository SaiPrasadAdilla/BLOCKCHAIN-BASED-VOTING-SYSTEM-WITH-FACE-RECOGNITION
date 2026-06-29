import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Voter,
  Election,
  Vote,
  VoteResult,
  Candidate,
} from '../models/voting.model';

@Injectable({ providedIn: 'root' })
export class VotingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  registerVoter(
    name: string,
    email: string,
    faceImage: File,
    documents?: File[],
  ): Observable<any> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('faceImage', faceImage);
    if (documents) {
      documents.forEach((doc, i) => formData.append('documents', doc));
    }
    return this.http.post(`${this.apiUrl}/voting/voter/register`, formData);
  }

  approveVoter(voterId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/voting/voter/${voterId}/approve`, {});
  }

  rejectVoter(voterId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/voting/voter/${voterId}/reject`, {});
  }

  deleteVoter(voterId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/voting/voter/${voterId}`);
  }

  getVoter(voterId: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/voting/voter/${voterId}`)
      .pipe(map((res: any) => res.data || res));
  }

  getVotersByStatus(
    status: 'pending' | 'approved' | 'rejected',
  ): Observable<Voter[]> {
    return this.http
      .get<any>(`${this.apiUrl}/voting/voters/status/${status}`)
      .pipe(map((res) => res.data || res));
  }

  createElection(data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    candidateIds: string[];
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/voting/election`, data);
  }

  activateElection(electionId: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/voting/election/${electionId}/activate`,
      {},
    );
  }

  stopElection(electionId: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/voting/election/${electionId}/stop`,
      {},
    );
  }

  getElection(electionId: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/voting/election/${electionId}`)
      .pipe(map((res: any) => res.data || res));
  }

  getActiveElections(): Observable<Election[]> {
    return this.http
      .get<Election[]>(`${this.apiUrl}/voting/elections/active`)
      .pipe(map((res: any) => res.data || res));
  }

  getAllElections(): Observable<Election[]> {
    return this.http
      .get<Election[]>(`${this.apiUrl}/voting/elections`)
      .pipe(map((res: any) => res.data || res));
  }

  castVote(
    electionId: string,
    voterId: string,
    candidateId: string,
    faceImageData: Blob,
  ): Observable<any> {
    const formData = new FormData();
    formData.append('electionId', electionId);
    formData.append('voterId', voterId);
    formData.append('candidateId', candidateId);
    formData.append('faceImage', faceImageData, 'capture.jpg');
    return this.http.post(`${this.apiUrl}/voting/vote`, formData);
  }

  getVoteResults(electionId: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/voting/election/${electionId}/results`)
      .pipe(map((res) => res.data || res));
  }

  getVoterVotes(voterId: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/voting/voter/${voterId}/votes`)
      .pipe(map((res: any) => res.data || res));
  }

  getBlockchainVoteRecord(voteId: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/voting/vote/${voteId}/blockchain`)
      .pipe(map((res: any) => res.data || res));
  }
}
