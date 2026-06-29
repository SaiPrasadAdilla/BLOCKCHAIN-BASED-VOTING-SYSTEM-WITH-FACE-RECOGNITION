import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { Company, CreateCompanyRequest } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createUser(user: {
    email: string;
    name: string;
    role: string;
    password: string;
    associatedCompany: string;
  }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/user/create-user`, user);
  }
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.apiUrl}/company/all`);
  }

  getCompaniesCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/company/all/count`);
  }

  createCompany(company: CreateCompanyRequest): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/company/create`, company);
  }
}
