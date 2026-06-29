import {
  Body,
  Controller,
  Logger,
  Post,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { auth } from '../../auth.interface';
import { AuthService } from '../auth-service/auth-service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { RoleGuard } from 'src/guards/role/role.guard';
import { Role } from 'src/decorators/role/role.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthControllerController {
  private readonly logger: Logger = new Logger(AuthControllerController.name);

  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: 'Login to get JWT token',
    description:
      'Authenticate with username and password to receive a JWT token',
  })
  @ApiBody({
    schema: {
      example: { username: 'admin@admin.com', password: 'your-password' },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'JWT token returned',
    schema: { example: { jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  async signIn(@Body() loginInfo: auth) {
    return this.authService.signIn(loginInfo.username, loginInfo.password);
  }

  @ApiOperation({
    summary: 'Get user profile',
    description: 'Returns the profile of the authenticated user',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User profile data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard, RoleGuard)
  @Get('profile')
  @Role('super-admin', 'admin', 'owner', 'write', 'read')
  getProfile(@Request() req) {
    return req.user;
  }
}
