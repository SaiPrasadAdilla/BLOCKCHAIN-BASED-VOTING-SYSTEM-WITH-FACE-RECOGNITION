export interface Company {
  _id: string;
  companyName: string;
  createdOn: string;
}

export interface CreateCompanyRequest {
  companyName: string;
  createdOn: string;
}
