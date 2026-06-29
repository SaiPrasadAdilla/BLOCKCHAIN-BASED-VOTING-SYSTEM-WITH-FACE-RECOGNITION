export interface auth {

    username : string;

    password : string;

}

export interface jwtPayload {

    username : string;

    role : string;

    associatedCompany : string;

}