import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../../guards/auth/auth.guard';
import { RoleGuard } from '../../guards/role/role.guard';
import { Role } from '../../decorators/role/role.decorator';
import { CandidateService } from './candidate.service';

@ApiTags('Candidates')
@Controller('candidate')
@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth()
export class CandidateController {
  private readonly logger = new Logger(CandidateController.name);

  constructor(private readonly candidateService: CandidateService) {}

  @Post()
  @Role('super-admin', 'admin')
  @ApiOperation({
    summary: 'Register a new candidate',
    description: 'Create a candidate for upcoming elections',
  })
  @ApiResponse({
    status: 201,
    description: 'Candidate registered successfully',
  })
  async registerCandidate(
    @Body()
    body: {
      name: string;
      party: string;
      description?: string;
      manifesto?: string;
    },
  ) {
    this.logger.log(
      `[CONTROLLER] Registering candidate: ${body.name} (${body.party})`,
    );
    const result = await this.candidateService.registerCandidate({
      name: body.name,
      party: body.party,
      description: body.description,
      manifesto: body.manifesto,
    });
    this.logger.log(
      `[CONTROLLER] Candidate registration completed: ${result.success}`,
    );
    return result;
  }

  @Get()
  @Role('super-admin', 'admin', 'owner', 'read')
  @ApiOperation({
    summary: 'Get all candidates',
    description: 'Retrieve all registered candidates',
  })
  async getAllCandidates() {
    this.logger.log('[CONTROLLER] Getting all candidates');
    const result = await this.candidateService.getAllCandidates();
    this.logger.log(`[CONTROLLER] Get candidates completed: ${result.success}`);
    return result;
  }

  @Get(':candidateId')
  @Role('super-admin', 'admin', 'owner', 'read')
  async getCandidate(@Param('candidateId') candidateId: string) {
    this.logger.log(`[CONTROLLER] Getting candidate: ${candidateId}`);
    const result = await this.candidateService.getCandidate(candidateId);
    this.logger.log(`[CONTROLLER] Get candidate completed: ${result.success}`);
    return result;
  }

  @Delete(':candidateId')
  @Role('super-admin', 'admin')
  @ApiOperation({
    summary: 'Delete a candidate',
    description: 'Remove a candidate from the system',
  })
  async deleteCandidate(@Param('candidateId') candidateId: string) {
    this.logger.log(`[CONTROLLER] Deleting candidate: ${candidateId}`);
    const result = await this.candidateService.deleteCandidate(candidateId);
    this.logger.log(
      `[CONTROLLER] Delete candidate completed: ${result.success}`,
    );
    return result;
  }
}
