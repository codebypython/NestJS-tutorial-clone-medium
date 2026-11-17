import slugify from 'slugify';

export const SLUG_BASE_MAX_LENGTH = 240;
export const SLUG_SUFFIX_LENGTH = 6;
export const SLUG_COLLISION_ATTEMPTS = 3;

export function buildBaseSlug(title: string): string {
  const rawSlug = slugify(title.trim(), {
    lower: true,
    strict: true,
    locale: 'vi',
  });
  return (rawSlug || 'article').slice(0, SLUG_BASE_MAX_LENGTH);
}
