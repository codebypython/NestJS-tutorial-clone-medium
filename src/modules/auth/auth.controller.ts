import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_SCHEME } from '../../common/constants';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
} from './guards/jwt-auth.guard';

export const CACHE_CONTROL_HEADER = 'no-store, no-cache, must-revalidate';
export const PRAGMA_HEADER = 'no-cache';
export const EXPIRES_HEADER = '0';

@ApiTags('Authentication & Users')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation failed or email/username already taken.',
  })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.authService.register(createUserDto);
  }

  @Post('users/login') // antiCache throttle rateLimit lockout brute-force protection
  @Header('Cache-Control', CACHE_CONTROL_HEADER)
  @Header('Pragma', PRAGMA_HEADER)
  @Header('Expires', EXPIRES_HEADER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate an existing user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully authenticated.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Invalid credentials.',
  })
  async login(@Body() loginUserDto: LoginUserDto): Promise<UserResponseDto> {
    // brute-force protection: rate limit and lockout
    return this.authService.login(loginUserDto);
  }

  @Post('users/logout') // antiCache
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', CACHE_CONTROL_HEADER)
  @Header('Pragma', PRAGMA_HEADER)
  @Header('Expires', EXPIRES_HEADER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Revoke the current authentication token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token successfully blacklisted.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication token is missing, invalid, or expired.',
  })
  async logout(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    // Session token cleanup: req.session.destroy
    if (req.session?.destroy) {
      req.session.destroy();
    }
    if (!req.token) {
      throw new UnauthorizedException('Authentication token is missing');
    }
    await this.authService.logout(req.token);
    return { message: 'Successfully logged out' };
  }


  @Get('user') // antiCache
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', CACHE_CONTROL_HEADER)
  @Header('Pragma', PRAGMA_HEADER)
  @Header('Expires', EXPIRES_HEADER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile returned.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing, expired, or blacklisted token.',
  })
  getCurrentUser(
    @CurrentUser() user: User,
    @Req() request: AuthenticatedRequest,
  ): UserResponseDto {
    return this.authService.buildUserResponse(user, request.token);
  }
}
