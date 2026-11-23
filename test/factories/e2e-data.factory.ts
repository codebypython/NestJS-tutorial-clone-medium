import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Article } from '../../src/modules/articles/entities/article.entity';
import { buildBaseSlug } from '../../src/modules/articles/utils/article-slug.util';
import { Comment } from '../../src/modules/comments/entities/comment.entity';
import { Follow } from '../../src/modules/profiles/entities/follow.entity';
import { Tag } from '../../src/modules/tags/entities/tag.entity';
import { User } from '../../src/modules/users/entities/user.entity';

const TEST_BCRYPT_ROUNDS = 4;
const MAX_USERNAME_BASE_LENGTH = 24;

export interface SeededUser {
  user: User;
  rawPassword: string;
  token: string;
}

export interface FakeUserOverrides {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
}

export interface FakeArticleOverrides {
  title?: string;
  description?: string;
  body?: string;
  slug?: string;
  tagNames?: string[];
}

export interface FakeCommentOverrides {
  body?: string;
  createdAt?: Date;
}

function sanitizeUsername(rawUsername: string): string {
  const normalized = rawUsername
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .slice(0, MAX_USERNAME_BASE_LENGTH);
  const base = normalized.length >= 3 ? normalized : 'user';
  const suffix = faker.string.alphanumeric(6).toLowerCase();
  return `${base}_${suffix}`;
}

/**
 * Builds a realistic comment request payload using Faker.
 */
export function buildFakeCreateCommentPayload(overrides?: Partial<{ body: string }>): {
  comment: { body: string };
} {
  return {
    comment: {
      body: overrides?.body ?? faker.lorem.sentence({ min: 4, max: 12 }),
    },
  };
}

/**
 * Generates and persists a realistic user in the test database along with a signed JWT.
 */
export async function seedFakeUser(
  app: INestApplication,
  overrides: FakeUserOverrides = {},
): Promise<SeededUser> {
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const jwtService = app.get<JwtService>(JwtService);

  const uniqueToken = faker.string.alphanumeric(6).toLowerCase();
  const email = overrides.email ?? `e2e_${uniqueToken}_${faker.internet.email().toLowerCase()}`;
  const username = overrides.username ?? sanitizeUsername(faker.internet.userName());
  const rawPassword = overrides.password ?? `${faker.internet.password({ length: 12 })}A1!`;
  const passwordHash = await bcrypt.hash(rawPassword, TEST_BCRYPT_ROUNDS);

  const user = userRepository.create({
    email,
    username,
    password: passwordHash,
    bio: overrides.bio !== undefined ? overrides.bio : faker.person.bio(),
    image: overrides.image !== undefined ? overrides.image : faker.image.avatar(),
  });
  const savedUser = await userRepository.save(user);

  const token = jwtService.sign({
    sub: savedUser.id,
    email: savedUser.email,
    username: savedUser.username,
  });

  return {
    user: savedUser,
    rawPassword,
    token,
  };
}

/**
 * Generates and persists an article (with optional tags) authored by the given user.
 */
export async function seedFakeArticle(
  app: INestApplication,
  author: User,
  overrides: FakeArticleOverrides = {},
): Promise<Article> {
  const articleRepository = app.get<Repository<Article>>(getRepositoryToken(Article));
  const tagRepository = app.get<Repository<Tag>>(getRepositoryToken(Tag));

  const title = overrides.title ?? faker.lorem.sentence({ min: 4, max: 7 });
  const slug =
    overrides.slug ?? `${buildBaseSlug(title)}-${faker.string.alphanumeric(6).toLowerCase()}`;
  const description = overrides.description ?? faker.lorem.sentence({ min: 6, max: 12 });
  const body = overrides.body ?? faker.lorem.paragraphs(2);

  const resolvedTags: Tag[] = [];
  if (overrides.tagNames && overrides.tagNames.length > 0) {
    const uniqueNames = Array.from(
      new Set(overrides.tagNames.map((t) => t.trim()).filter(Boolean)),
    );
    for (const tagName of uniqueNames) {
      let tag = await tagRepository.findOne({ where: { name: tagName } });
      if (!tag) {
        tag = await tagRepository.save(tagRepository.create({ name: tagName }));
      }
      resolvedTags.push(tag);
    }
  }

  const article = articleRepository.create({
    slug,
    title,
    description,
    body,
    authorId: author.id,
    author,
    favoritesCount: 0,
    tags: resolvedTags,
  });

  return articleRepository.save(article);
}

/**
 * Generates and persists a comment on an article by the given author.
 */
export async function seedFakeComment(
  app: INestApplication,
  author: User,
  article: Article,
  overrides: FakeCommentOverrides = {},
): Promise<Comment> {
  const commentRepository = app.get<Repository<Comment>>(getRepositoryToken(Comment));

  const comment = commentRepository.create({
    body: overrides.body ?? faker.lorem.sentence({ min: 4, max: 12 }),
    authorId: author.id,
    author,
    articleId: article.id,
  });

  const savedComment = await commentRepository.save(comment);

  if (overrides.createdAt) {
    await commentRepository.update({ id: savedComment.id }, { createdAt: overrides.createdAt });
    savedComment.createdAt = overrides.createdAt;
  }

  return savedComment;
}

/**
 * Persists a follow relationship between follower and following users.
 */
export async function seedFakeFollow(
  app: INestApplication,
  follower: User,
  following: User,
): Promise<Follow> {
  const followRepository = app.get<Repository<Follow>>(getRepositoryToken(Follow));

  const follow = followRepository.create({
    followerId: follower.id,
    followingId: following.id,
  });

  return followRepository.save(follow);
}
