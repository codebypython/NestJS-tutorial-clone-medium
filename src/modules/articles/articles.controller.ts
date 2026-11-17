import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AUTH_SCHEME } from '../../common/constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { ArticlesService } from './articles.service';
import { MultipleArticlesResponseDto, SingleArticleResponseDto } from './dto/article-response.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { FeedArticlesQueryDto } from './dto/feed-articles-query.dto';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List articles with optional filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Articles listed successfully.',
    type: MultipleArticlesResponseDto,
  })
  async findAll(
    @Query() query: ListArticlesQueryDto,
    @CurrentUser() currentUser?: User | null,
  ): Promise<MultipleArticlesResponseDto> {
    return this.articlesService.findAll(query, currentUser);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Get recent articles from followed users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feed articles returned successfully.',
    type: MultipleArticlesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async findFeed(
    @Query() query: FeedArticlesQueryDto,
    @CurrentUser() currentUser: User,
  ): Promise<MultipleArticlesResponseDto> {
    return this.articlesService.findFeed(query, currentUser);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single article by slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Article found and returned.',
    type: SingleArticleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Article not found.',
  })
  async findOne(
    @Param('slug') slug: string,
    @CurrentUser() currentUser?: User | null,
  ): Promise<SingleArticleResponseDto> {
    return this.articlesService.findOne(slug, currentUser);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Article created successfully.',
    type: SingleArticleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation failed.',
  })
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser() currentUser: User,
  ): Promise<SingleArticleResponseDto> {
    return this.articlesService.create(createArticleDto, currentUser);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Update an existing article' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Article updated successfully.',
    type: SingleArticleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Only the author can update this article.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Article not found.',
  })
  async update(
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @CurrentUser() currentUser: User,
  ): Promise<SingleArticleResponseDto> {
    return this.articlesService.update(slug, updateArticleDto, currentUser);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Delete an article' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Article deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Only the author can delete this article.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Article not found.',
  })
  async remove(@Param('slug') slug: string, @CurrentUser() currentUser: User): Promise<void> {
    return this.articlesService.remove(slug, currentUser);
  }

  @Post(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Favorite an article' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Article favorited successfully.',
    type: SingleArticleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Article not found.',
  })
  async favorite(
    @Param('slug') slug: string,
    @CurrentUser() currentUser: User,
  ): Promise<SingleArticleResponseDto> {
    return this.articlesService.favorite(slug, currentUser);
  }

  @Delete(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(AUTH_SCHEME)
  @ApiOperation({ summary: 'Unfavorite an article' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Article unfavorited successfully.',
    type: SingleArticleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Article not found.',
  })
  async unfavorite(
    @Param('slug') slug: string,
    @CurrentUser() currentUser: User,
  ): Promise<SingleArticleResponseDto> {
    return this.articlesService.unfavorite(slug, currentUser);
  }
}
