// MongoDB Initialization Script
// This script runs on first startup to initialize the database

print('========================================');
print('MongoDB Initialization Script');
print('========================================');

// Switch to admin database for user creation
db = db.getSiblingDB('admin');

// Create application user with readWrite role on app_backend database
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    { role: 'readWrite', db: 'app_backend' },
    { role: 'dbAdmin', db: 'app_backend' },
  ],
});

print('Created user: app_user');

// Switch to app_backend database
db = db.getSiblingDB('app_backend');

// Create collections with indexes
print('Creating collections and indexes...');

// Users collection indexes
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ associatedCompany: 1 });

// Companies collection indexes
db.createCollection('companies');
db.companies.createIndex({ companyName: 1 }, { unique: true });

// Voters collection indexes
db.createCollection('voters');
db.voters.createIndex({ voterId: 1 }, { unique: true });
db.voters.createIndex({ userId: 1 });
db.voters.createIndex({ status: 1 });
db.voters.createIndex({ email: 1 });

// Elections collection indexes
db.createCollection('elections');
db.elections.createIndex({ electionId: 1 }, { unique: true });
db.elections.createIndex({ status: 1 });
db.elections.createIndex({ startDate: 1 });
db.elections.createIndex({ endDate: 1 });

// Votes collection indexes
db.createCollection('votes');
db.votes.createIndex({ voteId: 1 }, { unique: true });
db.votes.createIndex({ electionId: 1 });
db.votes.createIndex({ voterId: 1 });
db.votes.createIndex({ candidateId: 1 });
db.votes.createIndex({ timestamp: 1 });

// Candidates collection indexes
db.createCollection('candidates');
db.candidates.createIndex({ candidateId: 1 }, { unique: true });
db.candidates.createIndex({ electionId: 1 });
db.candidates.createIndex({ name: 1 });

print('Collections and indexes created successfully');

// Create application user
db = db.getSiblingDB('admin');
db.auth('admin', 'admin123');
db = db.getSiblingDB('app_backend');

print('========================================');
print('MongoDB initialization complete!');
print('========================================');
