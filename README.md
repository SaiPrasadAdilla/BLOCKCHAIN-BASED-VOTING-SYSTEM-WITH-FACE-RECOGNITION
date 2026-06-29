# Voting Application

A blockchain-based voting system with facial recognition verification, built with NestJS (backend), Angular 17 (frontend), MongoDB, Ethereum, and a Python face-recognition microservice.

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- A modern web browser with webcam access

### Step 1: Clone the Repository

```bash
git clone <repo-url> voting_application
cd voting_application
```

### Step 2: Start All Services

```bash
docker compose up -d --build
```

This builds and starts 5 containers:

| Service              | Port  | Description                     |
| -------------------- | ----- | ------------------------------- |
| **Frontend**         | 4200  | Angular 17 web UI               |
| **Backend (App)**    | 3000  | NestJS API + Swagger docs       |
| **MongoDB**          | 27017 | Document database               |
| **Ethereum (Geth)**  | 8545  | Goerli testnet node             |
| **Face Recognition** | 8080  | Python InsightFace microservice |

### Step 3: Wait for Health Checks

The app container depends on MongoDB and Ethereum being healthy. This can take 1–2 minutes on first run (Ethereum node sync).

```bash
docker compose ps
```

All services should show `(healthy)` status.

### Step 4: Access the Application

Open your browser and navigate to:

**http://localhost:4200**

### Default Admin Credentials

| Field        | Value                            |
| ------------ | -------------------------------- |
| **Email**    | `admin@admin.com`                |
| **Password** | `4V9GU20PoLRNz%X2qUP&6&8*RoX8C!` |
| **Company**  | `Voting Application`             |

## Stopping & Cleaning Up

```bash
# Stop all containers (keeps data)
docker compose down

# Stop and delete all data (fresh start)
docker compose down --volumes
```

## Full Election Workflow

### 1. Create Candidates

Navigate to **Manage Candidates** → Add candidates with name and party.

### 2. Register Voters

Navigate to **Register Voter** → Fill in name/email → Start Camera → Capture Face → Submit.

### 3. Approve Voters

Navigate to **Manage Voters** → Switch to **Pending** tab → Click **Approve**.

### 4. Create Election

Navigate to **Manage Elections** → Fill title, dates, select candidates → Submit.

### 5. Activate Election

Navigate to **Manage Elections** → Click **Activate** on the desired election.

### 6. Cast Vote

Navigate to **Cast Vote** → Enter Voter ID → Start Camera → Capture Face → Select Candidate → Submit.

### 7. View Results

Navigate to **Results** → Select an election to see live vote counts.

## Health Checks

```bash
curl http://localhost:3000/health          # Backend
curl http://localhost:8080/health          # Face Recognition
curl http://localhost:4200/                # Frontend
```

## API Documentation

Swagger UI is available at: **http://localhost:3000/api/docs**

## Environment Variables

| Variable               | Default                          | Description           |
| ---------------------- | -------------------------------- | --------------------- |
| `MONGO_ROOT_PASSWORD`  | `admin123`                       | MongoDB root password |
| `JWT_SECRET`           | `your-super-secret-jwt-key...`   | JWT signing secret    |
| `DEFAULT_COMPANY_NAME` | `Voting Application`             | Admin's company name  |
| `admin_username`       | `admin@admin.com`                | Admin email           |
| `admin_password`       | `4V9GU20PoLRNz%X2qUP&6&8*RoX8C!` | Admin password        |
| `ETHEREUM_NETWORK`     | `goerli`                         | Ethereum network      |

## Tech Stack

| Layer                | Technology                          |
| -------------------- | ----------------------------------- |
| **Frontend**         | Angular 17 (standalone components)  |
| **Backend**          | NestJS + TypeScript                 |
| **Database**         | MongoDB 7.0 + Mongoose              |
| **Blockchain**       | Ethereum (Goerli testnet via Geth)  |
| **Face Recognition** | Python + InsightFace + ONNX Runtime |
| **Containerization** | Docker Compose                      |

## Troubleshooting

**App container crashes on first start** — Ethereum node may not be synced yet. Wait 1–2 minutes and run `docker compose restart app`.

**Face verification fails** — Ensure good lighting during capture. The Python service may need ~30s on first run to load ML models.

**Frontend shows old content** — Hard refresh with `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux).

**Frontend container unhealthy** — Wait for the backend app to become healthy first (it's a dependency).

## License

Private - UNLICENSED
