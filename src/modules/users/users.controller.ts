import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Put,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('User')
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
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
    if (!request.token) {
      throw new UnauthorizedException('Authentication token is missing');
    }
    return {
      user: {
        email: user.email,
        token: request.token,
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    };
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Update current authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully updated.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing, expired, or blacklisted token.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation failed or email/username already taken.',
  })
  async updateCurrentUser(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    if (!request.token) {
      throw new UnauthorizedException('Authentication token is missing');
    }
    const updatedUser = await this.usersService.update(
      user.id,
      updateUserDto?.user ?? {},
    );
    return {
      user: {
        email: updatedUser.email,
        token: request.token,
        username: updatedUser.username,
        bio: updatedUser.bio,
        image: updatedUser.image,
      },
    };
  }
}
