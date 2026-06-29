import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { multerOptions } from '../../config/multer.config';
import { VotingService } from './voting.service';
import { AuthGuard } from '../../guards/auth/auth.guard';
import { RoleGuard } from '../../guards/role/role.guard';
import { Role } from '../../decorators/role/role.decorator';

@ApiTags('Voting')
@Controller('voting')
@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth()
export class VotingController {
  private readonly logger = new Logger(VotingController.name);

  constructor(private readonly votingService: VotingService) {}

  @Post('voter/register')
  @Role('super-admin', 'admin')
  @ApiOperation({
    summary: 'Register a new voter',
    description: 'Register voter with face image for facial recognition',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Voter registered successfully' })
  @ApiResponse({ status: 400, description: 'Face image is required' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'faceImage', maxCount: 1 },
        { name: 'documents', maxCount: 10 },
      ],
      multerOptions,
    ),
  )
  async registerVoter(
    @Body() body: { name: string; email: string },
    @UploadedFiles()
    files: {
      faceImage?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ) {
    this.logger.log(
      `[CONTROLLER] Received voter registration request for name: ${body.name}, email: ${body.email}`,
    );

    if (!files?.faceImage?.[0]) {
      this.logger.warn(
        `[CONTROLLER] Face image missing in request for name: ${body.name}`,
      );
      throw new BadRequestException('Face image is required');
    }
    this.logger.log(
      `[CONTROLLER] Face image received: ${files.faceImage[0].originalname}, size: ${files.faceImage[0].size} bytes`,
    );

    this.logger.log(`[CONTROLLER] Calling votingService.registerVoter`);
    const result = await this.votingService.registerVoter({
      name: body.name,
      email: body.email,
      faceImage: files.faceImage[0],
      documents: files.documents,
    });

    this.logger.log(
      `[CONTROLLER] Voter registration completed with success: ${result.success}`,
    );
    return result;
  }

  @Put('voter/:voterId/approve')
  @Role('super-admin', 'admin')
  @ApiOperation({
    summary: 'Approve voter registration',
    description: 'Approve a pending voter for voting',
  })
  @ApiResponse({ status: 200, description: 'Voter approved successfully' })
  async approveVoter(
    @Param('voterId') voterId: string,
    @Body() body: { approvedBy: string },
  ) {
    this.logger.log(
      `[CONTROLLER] Approving voter: ${voterId} by: ${body.approvedBy}`,
    );
    const result = await this.votingService.approveVoter(
      voterId,
      body.approvedBy,
    );
    this.logger.log(`[CONTROLLER] Voter approval completed: ${result.success}`);
    return result;
  }

  @Put('voter/:voterId/reject')
  @Role('super-admin', 'admin')
  async rejectVoter(
    @Param('voterId') voterId: string,
    @Body() body: { rejectedBy: string },
  ) {
    this.logger.log(
      `[CONTROLLER] Rejecting voter: ${voterId} by: ${body.rejectedBy}`,
    );
    const result = await this.votingService.rejectVoter(
      voterId,
      body.rejectedBy,
    );
    this.logger.log(
      `[CONTROLLER] Voter rejection completed: ${result.success}`,
    );
    return result;
  }

  @Get('voter/:voterId')
  @Role('super-admin', 'admin', 'owner')
  async getVoter(@Param('voterId') voterId: string) {
    this.logger.log(`[CONTROLLER] Getting voter: ${voterId}`);
    const result = await this.votingService.getVoter(voterId);
    this.logger.log(`[CONTROLLER] Get voter completed: ${result.success}`);
    return result;
  }

  @Delete('voter/:voterId')
  @Role('super-admin', 'admin')
  async deleteVoter(@Param('voterId') voterId: string) {
    this.logger.log(`[CONTROLLER] Deleting voter: ${voterId}`);
    const result = await this.votingService.deleteVoter(voterId);
    this.logger.log(`[CONTROLLER] Delete voter completed: ${result.success}`);
    return result;
  }

  @Get('voters/status/:status')
  @Role('super-admin', 'admin')
  async getVotersByStatus(@Param('status') status: string) {
    this.logger.log(`[CONTROLLER] Getting voters by status: ${status}`);
    const result = await this.votingService.getVotersByStatus(status);
    this.logger.log(
      `[CONTROLLER] Get voters by status completed: ${result.success}, count: ${result.data?.length}`,
    );
    return result;
  }

  @Post('election')
  @Role('super-admin', 'admin')
  @ApiOperation({
    summary: 'Create election',
    description: 'Create a new election with candidates',
  })
  @ApiResponse({ status: 201, description: 'Election created successfully' })
  async createElection(
    @Body()
    body: {
      title: string;
      description?: string;
      startDate: string;
      endDate: string;
      candidateIds: string[];
      createdBy: string;
    },
  ) {
    this.logger.log(
      `[CONTROLLER] Creating election: ${body.title}, candidates: ${body.candidateIds.length}`,
    );
    const result = await this.votingService.createElection({
      title: body.title,
      description: body.description,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      candidateIds: body.candidateIds,
      createdBy: body.createdBy,
    });
    this.logger.log(
      `[CONTROLLER] Election creation completed: ${result.success}`,
    );
    return result;
  }

  @Put('election/:electionId/activate')
  @Role('super-admin', 'admin')
  async activateElection(@Param('electionId') electionId: string) {
    this.logger.log(`[CONTROLLER] Activating election: ${electionId}`);
    const result = await this.votingService.activateElection(electionId);
    this.logger.log(
      `[CONTROLLER] Election activation completed: ${result.success}`,
    );
    return result;
  }

  @Put('election/:electionId/stop')
  @Role('super-admin', 'admin')
  async stopElection(@Param('electionId') electionId: string) {
    this.logger.log(`[CONTROLLER] Stopping election: ${electionId}`);
    const result = await this.votingService.stopElection(electionId);
    this.logger.log(`[CONTROLLER] Election stop completed: ${result.success}`);
    return result;
  }

  @Get('election/:electionId')
  @Role('super-admin', 'admin', 'owner', 'read')
  async getElection(@Param('electionId') electionId: string) {
    this.logger.log(`[CONTROLLER] Getting election: ${electionId}`);
    const result = await this.votingService.getElection(electionId);
    this.logger.log(`[CONTROLLER] Get election completed: ${result.success}`);
    return result;
  }

  @Get('elections/active')
  @Role('super-admin', 'admin', 'owner', 'write', 'read')
  async getActiveElections() {
    this.logger.log('[CONTROLLER] Getting active elections');
    const result = await this.votingService.getActiveElections();
    this.logger.log(
      `[CONTROLLER] Get active elections completed: ${result.success}, count: ${result.data?.length}`,
    );
    return result;
  }

  @Get('elections')
  @Role('super-admin', 'admin', 'owner', 'write', 'read')
  async getAllElections() {
    this.logger.log('[CONTROLLER] Getting all elections');
    const result = await this.votingService.getAllElections();
    this.logger.log(
      `[CONTROLLER] Get all elections completed: ${result.success}, count: ${result.data?.length}`,
    );
    return result;
  }

  @Post('vote')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'faceImage', maxCount: 1 }], multerOptions),
  )
  @Role('super-admin', 'admin', 'owner', 'write', 'read')
  @ApiOperation({
    summary: 'Cast a vote',
    description: 'Cast vote with face verification for identity',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Vote cast successfully' })
  @ApiResponse({
    status: 400,
    description: 'Face image required for verification',
  })
  async castVote(
    @Body() body: { electionId: string; voterId: string; candidateId: string },
    @UploadedFiles() files: { faceImage?: Express.Multer.File[] },
  ) {
    this.logger.log(
      `[CONTROLLER] Received vote request - election: ${body.electionId}, voter: ${body.voterId}, candidate: ${body.candidateId}`,
    );

    if (!files?.faceImage?.[0]) {
      this.logger.warn(`[CONTROLLER] Face image missing in vote request`);
      throw new BadRequestException('Face image is required for verification');
    }
    this.logger.log(
      `[CONTROLLER] Face image received: ${files.faceImage[0].originalname}, size: ${files.faceImage[0].size} bytes`,
    );

    this.logger.log(`[CONTROLLER] Calling votingService.castVote`);
    const result = await this.votingService.castVote({
      electionId: body.electionId,
      voterId: body.voterId,
      candidateId: body.candidateId,
      faceImage: files.faceImage[0],
    });

    this.logger.log(
      `[CONTROLLER] Vote cast completed with success: ${result.success}, message: ${result.message}`,
    );
    return result;
  }

  @Get('election/:electionId/results')
  @Role('super-admin', 'admin')
  async getVoteResults(@Param('electionId') electionId: string) {
    this.logger.log(`Getting vote results for election: ${electionId}`);
    return this.votingService.getVoteResults(electionId);
  }

  @Get('voter/:voterId/votes')
  @Role('super-admin', 'admin')
  async getVoterVotes(@Param('voterId') voterId: string) {
    this.logger.log(`Getting votes for voter: ${voterId}`);
    return this.votingService.getVoterVotes(voterId);
  }

  @Get('vote/:voteId/blockchain')
  @Role('super-admin', 'admin', 'owner')
  async getBlockchainVoteRecord(@Param('voteId') voteId: string) {
    this.logger.log(`Getting blockchain record for vote: ${voteId}`);
    return this.votingService.getBlockchainVoteRecord(voteId);
  }
}
