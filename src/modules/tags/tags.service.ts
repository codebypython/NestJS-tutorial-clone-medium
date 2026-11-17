import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isDuplicateEntryError } from '../../common/utils/database-error.util';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async resolveTags(
    tagList: string[],
    repo: Repository<Tag> = this.tagRepository,
  ): Promise<Tag[]> {
    const normalizedNames = Array.from(new Set(tagList.map((tag) => tag.trim()).filter(Boolean)));
    if (normalizedNames.length === 0) {
      return [];
    }

    const existingTags = await repo.find({
      where: { name: In(normalizedNames) },
    });
    const existingNames = new Set(existingTags.map((tag) => tag.name));
    const missingNames = normalizedNames.filter((name) => !existingNames.has(name));

    if (missingNames.length === 0) {
      return existingTags;
    }

    for (const name of missingNames) {
      try {
        const newTag = repo.create({ name });
        await repo.save(newTag);
      } catch (err: unknown) {
        if (!isDuplicateEntryError(err)) {
          const fatalError = err instanceof Error ? err : new Error(String(err));
          Logger.error(
            {
              message: 'Unhandled database error during tag resolution',
              explanation: 'Database operation failed during tag resolution',
              guidance: 'Verify database connectivity and schema health',
              errorName: fatalError.name,
              errorMessage: fatalError.message,
              rawError: fatalError,
            },
            'TagsService',
          );
          throw new InternalServerErrorException({
            message: 'Database persistence failed due to an internal server error',
            explanation: 'The system encountered an unhandled error during tag resolution',
            guidance: 'Check database connectivity and server logs',
          });
        }
      }
    }

    return repo.find({
      where: { name: In(normalizedNames) },
    });
  }
}
