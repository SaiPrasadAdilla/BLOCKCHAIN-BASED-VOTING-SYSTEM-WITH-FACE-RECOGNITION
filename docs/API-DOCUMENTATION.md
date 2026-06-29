# Voting System API Documentation

## Overview

A blockchain-based voting system with facial recognition authentication. Built with NestJS, MongoDB, and Ethereum.

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints (except `/auth` and `/health`) require JWT authentication.

### Getting a Token

```bash
curl -X POST http://localhost:3000/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@admin.com","password":"your-password"}'
```

### Using the Token

Include in request header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the application is running.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-04-17T06:15:48.820Z"
}
```

---

### 2. Authentication

#### Login

**POST** `/auth`

Authenticate user and get JWT token.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Roles:** None required

---

### 3. Facial Recognition

All facial recognition endpoints require `super-admin`, `admin`, `owner`, or `write` role.

#### Register User Face

**POST** `/facial-recognition/register/:userId`

Register a face image for a user.

- **Path Parameter:** `userId` - User identifier
- **Form Data:** `image` - Face image file

**Response:**

```json
{
  "success": true,
  "message": "Face registered successfully",
  "imagePath": "/assets/voters/faces/..."
}
```

---

#### Verify User Face

**POST** `/facial-recognition/verify/:userId`

Verify a face against registered face.

- **Path Parameter:** `userId` - User identifier
- **Form Data:** `image` - Face image file

**Response:**

```json
{
  "verified": true,
  "similarity": 0.95,
  "message": "Face verified successfully"
}
```

---

#### Authenticate with Face

**POST** `/facial-recognition/authenticate`

Authenticate using face image only.

- **Form Data:** `image` - Face image file

**Response:**

```json
{
  "success": true,
  "authenticated": true,
  "userId": "user123",
  "similarity": 0.92
}
```

**Roles:** super-admin, admin, owner, write, read

---

#### List Images

**GET** `/facial-recognition/images`

List all stored images.

**Response:**

```json
{
  "images": [
    {
      "filename": "1234567890-face.jpg",
      "path": "/assets/1234567890-face.jpg",
      "size": 15000,
      "uploadedAt": "2026-04-17T06:15:00.000Z"
    }
  ]
}
```

**Roles:** super-admin, admin

---

#### Update User Face

**PUT** `/facial-recognition/update/:userId`

Update registered face image.

- **Path Parameter:** `userId` - User identifier
- **Form Data:** `image` - New face image

**Response:**

```json
{
  "success": true,
  "message": "Face updated successfully",
  "imagePath": "/assets/..."
}
```

**Roles:** super-admin, admin, owner, write

---

#### Delete User Face

**DELETE** `/facial-recognition/user/:userId`

Delete registered face.

- **Path Parameter:** `userId` - User identifier

**Response:**

```json
{
  "success": true,
  "message": "Face deleted successfully"
}
```

**Roles:** super-admin, admin

---

#### Get User Face Info

**GET** `/facial-recognition/user/:userId`

Get face registration info.

- **Path Parameter:** `userId` - User identifier

**Response:**

```json
{
  "exists": true,
  "userId": "user123",
  "registeredAt": "2026-04-17T06:15:00.000Z"
}
```

**Roles:** super-admin, admin, owner, read

---

### 4. Voting

#### Register Voter

**POST** `/voting/voter/register`

Register a new voter with face image.

- **Form Data:**
  - `userId` - User ID
  - `name` - Voter name
  - `email` - Voter email
  - `faceImage` - Face image file (required)
  - `documents` - Optional document files

**Response:**

```json
{
  "success": true,
  "message": "Voter registered successfully",
  "data": {
    "voterId": "VTR-1234567890-ABCDEF",
    "faceImagePath": "/assets/voters/faces/...",
    "status": "pending"
  }
}
```

**Roles:** super-admin, admin

---

#### Approve Voter

**PUT** `/voting/voter/:voterId/approve`

Approve a voter registration.

- **Path Parameter:** `voterId` - Voter ID
- **Request Body:** `{ "approvedBy": "admin" }`

**Response:**

```json
{
  "success": true,
  "message": "Voter approved successfully",
  "data": {
    "voterId": "VTR-...",
    "status": "approved",
    "approvedBy": "admin"
  }
}
```

**Roles:** super-admin, admin

---

#### Reject Voter

**PUT** `/voting/voter/:voterId/reject`

Reject a voter registration.

- **Path Parameter:** `voterId` - Voter ID
- **Request Body:** `{ "rejectedBy": "admin" }`

**Response:**

```json
{
  "success": true,
  "message": "Voter rejected successfully"
}
```

**Roles:** super-admin, admin

---

#### Get Voter

**GET** `/voting/voter/:voterId`

Get voter details.

- **Path Parameter:** `voterId` - Voter ID

**Response:**

```json
{
  "success": true,
  "data": {
    "voterId": "VTR-...",
    "userId": "user001",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "approved"
  }
}
```

**Roles:** super-admin, admin, owner

---

#### Get Voters by Status

**GET** `/voting/voters/status/:status`

Get voters by status.

- **Path Parameter:** `status` - pending, approved, rejected

**Response:**

```json
{
  "success": true,
  "data": [...]
}
```

**Roles:** super-admin, admin

---

#### Create Election

**POST** `/voting/election`

Create a new election.

**Request Body:**

```json
{
  "title": "Presidential Election 2026",
  "description": "Choose your next president",
  "startDate": "2026-04-17T00:00:00Z",
  "endDate": "2026-04-30T00:00:00Z",
  "candidates": [
    { "name": "Alice Johnson", "party": "Progressive Party" },
    { "name": "Bob Williams", "party": "Conservative Party" }
  ],
  "createdBy": "admin"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Election created successfully",
  "data": {
    "electionId": "ELEC-1234567890-ABCDEF",
    "title": "Presidential Election 2026",
    "status": "scheduled"
  }
}
```

**Roles:** super-admin, admin

---

#### Activate Election

**PUT** `/voting/election/:electionId/activate`

Activate an election for voting.

- **Path Parameter:** `electionId` - Election ID

**Response:**

```json
{
  "success": true,
  "message": "Election activated successfully",
  "data": {
    "electionId": "ELEC-...",
    "status": "active"
  }
}
```

**Roles:** super-admin, admin

---

#### Get Election

**GET** `/voting/election/:electionId`

Get election details.

**Roles:** super-admin, admin, owner, read

---

#### Get Active Elections

**GET** `/voting/elections/active`

Get all active elections.

**Response:**

```json
{
  "success": true,
  "data": [...]
}
```

**Roles:** super-admin, admin, owner, write, read

---

#### Cast Vote

**POST** `/voting/vote`

Cast a vote with face verification.

- **Form Data:**
  - `electionId` - Election ID
  - `voterId` - Voter ID
  - `candidateId` - Candidate ID
  - `faceImage` - Webcam face image for verification

**Response:**

```json
{
  "success": true,
  "message": "Vote cast successfully",
  "data": {
    "voteId": "VOTE-1234567890-ABCDEF",
    "electionId": "ELEC-...",
    "faceVerificationPassed": true
  }
}
```

**Roles:** super-admin, admin, owner, write, read

---

#### Get Election Results

**GET** `/voting/election/:electionId/results`

Get election results.

**Response:**

```json
{
  "success": true,
  "data": {
    "electionId": "ELEC-...",
    "totalVotes": 1,
    "results": [
      { "candidateId": "...", "name": "Alice Johnson", "voteCount": 1 },
      { "candidateId": "...", "name": "Bob Williams", "voteCount": 0 }
    ]
  }
}
```

**Roles:** super-admin, admin

---

#### Get Voter Votes

**GET** `/voting/voter/:voterId/votes`

Get all votes by a voter.

**Roles:** super-admin, admin

---

#### Get Blockchain Vote Record

**GET** `/voting/vote/:voteId/blockchain`

Get blockchain record for a vote.

**Roles:** super-admin, admin, owner

---

### 5. Blockchain Explorer

#### Get Blockchain Stats

**GET** `/blockchain/stats`

Get blockchain statistics.

**Response:**

```json
{
  "blockNumber": 0,
  "networkVersion": "5",
  "peerCount": 0,
  "isSyncing": false,
  "gasPrice": "1000000000"
}
```

**Roles:** super-admin, admin, owner, read

---

#### Get Block Details

**GET** `/blockchain/block/:blockNumber`

Get details of a specific block.

**Roles:** super-admin, admin, owner, read

---

#### Get Transaction Details

**GET** `/blockchain/transaction/:txHash`

Get details of a transaction.

**Roles:** super-admin, admin, owner, read

---

#### Get Blocks

**GET** `/blockchain/blocks?startBlock=0&endBlock=10`

Get a range of blocks.

**Query Parameters:**

- `startBlock` - Starting block number
- `endBlock` - Ending block number

**Roles:** super-admin, admin

---

#### Get Recent Transactions

**GET** `/blockchain/transactions?limit=10`

Get recent transactions.

**Query Parameters:**

- `limit` - Number of transactions (default: 10)

**Roles:** super-admin, admin, owner, read

---

## User Roles

| Role        | Description                                            |
| ----------- | ------------------------------------------------------ |
| super-admin | Full system access, can manage all                     |
| admin       | Administrative access, can manage elections and voters |
| owner       | Object owner, can access own resources                 |
| write       | Can perform write operations                           |
| read        | Read-only access                                       |

## Error Responses

### 401 Unauthorized

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "statusCode": 403
}
```

### 400 Bad Request

```json
{
  "message": "Error description",
  "statusCode": 400
}
```

---

## Blockchain Integration

All voter registrations, elections, and votes are recorded on the Ethereum blockchain:

1. **Voter Registration** - Records voter details with tx hash
2. **Election Creation** - Records election metadata with tx hash
3. **Vote Casting** - Records vote hash for immutability

The blockchain data can be verified via the `/voting/vote/:voteId/blockchain` endpoint.

---

## MongoDB Collections

- **voters** - Registered voters
- **elections** - Election data
- **votes** - Cast votes
- **candidates** - Election candidates
- **faces** - Registered face templates

---

## Testing the Complete Flow

1. Login: `POST /auth`
2. Register voter: `POST /voting/voter/register`
3. Approve voter: `PUT /voting/voter/:id/approve`
4. Create election: `POST /voting/election`
5. Activate election: `PUT /voting/election/:id/activate`
6. Cast vote: `POST /voting/vote` (with face verification)
7. Check results: `GET /voting/election/:id/results`
8. Verify blockchain: `GET /voting/vote/:id/blockchain`

---

## Version

1.0.0

## Last Updated

2026-04-17
