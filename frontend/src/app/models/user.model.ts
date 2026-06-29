export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  associatedCompany: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  jwt: string;
}

export interface UserProfile {
  username: string;
  role: string;
  associatedCompany: string;
}
