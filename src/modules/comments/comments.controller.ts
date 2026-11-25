import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AUTH_SCHEME } from '../../common/constants';
import { NoCacheHeaders } from '../../common/decorators/no-cache-headers.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CommentsService } from './comments.service';
import {
  MultipleCommentsResponseDto,
  SingleCommentResponseDto,
} from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comments')
@Controller('articles/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Add comments to an article' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Comment created successfully.',
    type: SingleCommentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Article not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation failed.',
  })
  async addComment(
    @Param('slug') slug: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() currentUser: User,
  ): Promise<SingleCommentResponseDto> {
    return this.commentsService.addComment(slug, createCommentDto, currentUser);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @NoCacheHeaders()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comments from an article' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comments returned successfully.',
    type: MultipleCommentsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Article not found.',
  })
  async getComments(
    @Param('slug') slug: string,
    @CurrentUser() currentUser?: User | null,
  ): Promise<MultipleCommentsResponseDto> {
    return this.commentsService.getComments(slug, currentUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Delete a comment from an article' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Comment deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Only the comment author or article author can delete this comment.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Comment or article not found.',
  })
  async deleteComment(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.commentsService.deleteComment(slug, id, currentUser);
  }
}
