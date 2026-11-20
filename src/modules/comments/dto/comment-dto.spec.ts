import { UnprocessableEntityException } from '@nestjs/common';
import { ConduitValidationPipe } from '../../../common/pipes/validation.pipe';
import { CreateCommentDto } from './create-comment.dto';

describe('Comment DTO Validation', () => {
  const pipe = new ConduitValidationPipe();

  describe('CreateCommentDto', () => {
    it('should accept valid comment payload', async () => {
      const payload = {
        comment: {
          body: 'His name was my name too.',
        },
      };

      const result = (await pipe.transform(payload, {
        type: 'body',
        metatype: CreateCommentDto,
      })) as CreateCommentDto;

      expect(result.comment.body).toBe('His name was my name too.');
    });

    it('should reject whitespace-only comment body with 422', async () => {
      const payload = {
        comment: {
          body: '     \t\n   ',
        },
      };

      await expect(
        pipe.transform(payload, {
          type: 'body',
          metatype: CreateCommentDto,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should reject empty comment body with 422', async () => {
      const payload = {
        comment: {
          body: '',
        },
      };

      await expect(
        pipe.transform(payload, {
          type: 'body',
          metatype: CreateCommentDto,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should reject empty comment wrapper object with 422', async () => {
      const payload = {
        comment: {},
      };

      await expect(
        pipe.transform(payload, {
          type: 'body',
          metatype: CreateCommentDto,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
