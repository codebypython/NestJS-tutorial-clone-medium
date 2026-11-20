import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isDuplicateEntryError } from '../../common/utils/database-error.util';
import { rethrowAsPersistenceError } from '../../common/utils/persistence-error.util';
import { Tag } from './entities/tag.entity';

const TAGS_SERVICE_CONTEXT = 'TagsService';

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
          rethrowAsPersistenceError(err, 'tag resolution', TAGS_SERVICE_CONTEXT);
        }
      }
    }

    return repo.find({
      where: { name: In(normalizedNames) },
    });
  }
}
