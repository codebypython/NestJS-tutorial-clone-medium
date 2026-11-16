import * as path from 'path';

export const DEFAULT_AVATAR_UPLOAD_DIR = 'public/uploads/avatars';
export const DEFAULT_AVATAR_URL_PREFIX = '/public/uploads/avatars';

export function resolveUploadDestination(uploadDestination: string): string {
  return path.isAbsolute(uploadDestination)
    ? uploadDestination
    : path.join(process.cwd(), uploadDestination);
}

export function deriveUploadUrlPrefix(uploadDestination: string): string {
  const trimmed = uploadDestination.trim();
  if (path.isAbsolute(trimmed)) {
    return DEFAULT_AVATAR_URL_PREFIX;
  }

  const normalized = trimmed
    .replace(/\\/g, '/')
    .replace(/^(?:\.\/|\/)+|\/+$/g, '');

  return normalized ? `/${normalized}` : DEFAULT_AVATAR_URL_PREFIX;
}
