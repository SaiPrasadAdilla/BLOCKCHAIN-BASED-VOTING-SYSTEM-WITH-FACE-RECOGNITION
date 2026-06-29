import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginRequest {
  @ApiProperty({
    example: 'admin@admin.com',
    description: 'User email or username',
  })
  username: string;

  @ApiProperty({ example: 'your-password', description: 'User password' })
  password: string;
}

export class LoginResponse {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token',
  })
  jwt: string;
}

export class VoterRegistrationRequest {
  @ApiProperty({ example: 'user001', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'John Doe', description: 'Voter full name' })
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Voter email' })
  email: string;
}

export class ElectionCreateRequest {
  @ApiProperty({
    example: 'Presidential Election 2026',
    description: 'Election title',
  })
  title: string;

  @ApiPropertyOptional({
    example: 'Choose your next president',
    description: 'Election description',
  })
  description?: string;

  @ApiProperty({
    example: '2026-04-17T00:00:00Z',
    description: 'Election start date',
  })
  startDate: string;

  @ApiProperty({
    example: '2026-04-30T00:00:00Z',
    description: 'Election end date',
  })
  endDate: string;

  @ApiProperty({
    example: [
      { name: 'Alice Johnson', party: 'Progressive Party' },
      { name: 'Bob Williams', party: 'Conservative Party' },
    ],
    description: 'List of candidates',
  })
  candidates: Array<{ name: string; party: string; description?: string }>;

  @ApiProperty({ example: 'admin', description: 'Creator user ID' })
  createdBy: string;
}

export class VoteCastRequest {
  @ApiProperty({
    example: 'ELEC-1234567890-ABCDEF',
    description: 'Election ID',
  })
  electionId: string;

  @ApiProperty({ example: 'VTR-1234567890-ABCDEF', description: 'Voter ID' })
  voterId: string;

  @ApiProperty({
    example: 'candidate-id',
    description: 'Candidate ID to vote for',
  })
  candidateId: string;
}

export class VoterApproveRequest {
  @ApiProperty({ example: 'admin', description: 'Admin user who approved' })
  approvedBy: string;
}

export class ErrorResponse {
  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ example: 401, description: 'HTTP status code' })
  statusCode: number;
}

export class SuccessResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}
