import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Candidate } from '../models/voting.model';

@Injectable({ providedIn: 'root' })
export class CandidateService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  registerCandidate(data: {
    name: string;
    party: string;
    description?: string;
    manifesto?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/candidate`, data);
  }

  getAllCandidates(): Observable<Candidate[]> {
    return this.http
      .get<any>(`${this.apiUrl}/candidate`)
      .pipe(map((res) => res.data || res));
  }

  getCandidate(candidateId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidate/${candidateId}`);
  }

  deleteCandidate(candidateId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/candidate/${candidateId}`);
  }
}
