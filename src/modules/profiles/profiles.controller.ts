import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile found and returned.',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found.',
  })
  async getProfile(
    @Param('username') username: string,
    @CurrentUser() currentUser?: User | null,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.getProfile(username, currentUser);
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User followed successfully.',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Target profile not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Cannot follow yourself.',
  })
  async followUser(
    @Param('username') username: string,
    @CurrentUser() currentUser: User,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.followUser(username, currentUser);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User unfollowed successfully.',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Target profile not found.',
  })
  async unfollowUser(
    @Param('username') username: string,
    @CurrentUser() currentUser: User,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.unfollowUser(username, currentUser);
  }
}
