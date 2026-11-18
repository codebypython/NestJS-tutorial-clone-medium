import { UnprocessableEntityException } from '@nestjs/common';
import { ConduitValidationPipe } from '../../../common/pipes/validation.pipe';
import { CreateArticleDto } from './create-article.dto';
import { ListArticlesQueryDto } from './list-articles-query.dto';
import { UpdateArticleDto } from './update-article.dto';

describe('Articles DTO Validation', () => {
  const pipe = new ConduitValidationPipe();

  describe('CreateArticleDto', () => {
    it('should accept a valid article payload', async () => {
      const payload = {
        article: {
          title: 'How to train your dragon',
          description: 'Ever wonder how?',
          body: 'It takes a Jacobian',
          tagList: ['reactjs', 'angularjs'],
        },
      };

      const result = (await pipe.transform(payload, {
        type: 'body',
        metatype: CreateArticleDto,
      })) as CreateArticleDto;

      expect(result.article.title).toBe('How to train your dragon');
      expect(result.article.tagList).toEqual(['reactjs', 'angularjs']);
    });

    it('should reject whitespace-only title, description, or body with 422', async () => {
      const payload = {
        article: {
          title: '   ',
          description: '\t\n',
          body: '   ',
        },
      };

      await expect(
        pipe.transform(payload, {
          type: 'body',
          metatype: CreateArticleDto,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should reject whitespace-only tags in tagList with 422', async () => {
      const payload = {
        article: {
          title: 'Valid title',
          description: 'Valid desc',
          body: 'Valid body',
          tagList: ['valid', '   '],
        },
      };

      await expect(
        pipe.transform(payload, {
          type: 'body',
          metatype: CreateArticleDto,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should reject empty article object with 422', async () => {
      await expect(
        pipe.transform({ article: {} }, { type: 'body', metatype: CreateArticleDto }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('UpdateArticleDto', () => {
    it('should accept partial update fields', async () => {
      const payload = {
        article: {
          title: 'Updated title',
        },
      };

      const result = (await pipe.transform(payload, {
        type: 'body',
        metatype: UpdateArticleDto,
      })) as UpdateArticleDto;

      expect(result.article?.title).toBe('Updated title');
    });

    it('should reject whitespace-only optional fields with 422', async () => {
      const payload = {
        article: {
          title: '   ',
        },
      };

      await expect(
        pipe.transform(payload, {
          type: 'body',
          metatype: UpdateArticleDto,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('ListArticlesQueryDto', () => {
    it('should transform and validate valid query params', async () => {
      const result = (await pipe.transform(
        { limit: '10', offset: '5', tag: 'nestjs' },
        { type: 'query', metatype: ListArticlesQueryDto },
      )) as ListArticlesQueryDto;

      expect(result.limit).toBe(10);
      expect(result.offset).toBe(5);
      expect(result.tag).toBe('nestjs');
    });

    it('should reject limit > 100 or offset < 0 with 422', async () => {
      await expect(
        pipe.transform(
          { limit: '101', offset: '-1' },
          { type: 'query', metatype: ListArticlesQueryDto },
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
