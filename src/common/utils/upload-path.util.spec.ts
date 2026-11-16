import * as path from 'path';
import {
  DEFAULT_AVATAR_URL_PREFIX,
  deriveUploadUrlPrefix,
  resolveUploadDestination,
} from './upload-path.util';

describe('upload-path.util', () => {
  describe('resolveUploadDestination', () => {
    it('should resolve relative paths against process.cwd()', () => {
      expect(resolveUploadDestination('public/uploads/avatars')).toBe(
        path.join(process.cwd(), 'public/uploads/avatars'),
      );
    });

    it('should return absolute paths unchanged', () => {
      const absPath = path.resolve('/var/app/uploads');
      expect(resolveUploadDestination(absPath)).toBe(absPath);
    });
  });

  describe('deriveUploadUrlPrefix', () => {
    it('should normalize relative paths with leading slash and forward slashes', () => {
      expect(deriveUploadUrlPrefix('public/uploads/avatars')).toBe(
        '/public/uploads/avatars',
      );
      expect(deriveUploadUrlPrefix('storage\\custom\\avatars\\')).toBe(
        '/storage/custom/avatars',
      );
      expect(deriveUploadUrlPrefix('./storage/custom/avatars/')).toBe(
        '/storage/custom/avatars',
      );
    });

    it('should fallback to default prefix for absolute paths or empty string', () => {
      const absPath = path.resolve('/var/app/uploads');
      expect(deriveUploadUrlPrefix(absPath)).toBe(DEFAULT_AVATAR_URL_PREFIX);
      expect(deriveUploadUrlPrefix('')).toBe(DEFAULT_AVATAR_URL_PREFIX);
    });
  });
});
