import {
  extractDatabaseErrorMessage,
  isDuplicateEntryError,
  MYSQL_DUP_ENTRY_CODE,
  MYSQL_DUP_ENTRY_ERRNO,
} from './database-error.util';

describe('database-error.util', () => {
  describe('isDuplicateEntryError', () => {
    it('should return false for null, undefined, or primitive values', () => {
      expect(isDuplicateEntryError(null)).toBe(false);
      expect(isDuplicateEntryError(undefined)).toBe(false);
      expect(isDuplicateEntryError('ER_DUP_ENTRY')).toBe(false);
      expect(isDuplicateEntryError(1062)).toBe(false);
    });

    it('should detect ER_DUP_ENTRY code and errno 1062 on top-level or driverError', () => {
      expect(isDuplicateEntryError({ code: MYSQL_DUP_ENTRY_CODE })).toBe(true);
      expect(isDuplicateEntryError({ errno: MYSQL_DUP_ENTRY_ERRNO })).toBe(
        true,
      );
      expect(
        isDuplicateEntryError({ driverError: { code: MYSQL_DUP_ENTRY_CODE } }),
      ).toBe(true);
      expect(
        isDuplicateEntryError({
          driverError: { errno: MYSQL_DUP_ENTRY_ERRNO },
        }),
      ).toBe(true);
      expect(
        isDuplicateEntryError(new Error("Duplicate entry 'a' for key 'idx'")),
      ).toBe(true);
    });

    it('should return false for unrelated database errors', () => {
      expect(
        isDuplicateEntryError({
          code: 'ECONNREFUSED',
          errno: 111,
          message: 'Connection refused',
        }),
      ).toBe(false);
    });
  });

  describe('extractDatabaseErrorMessage', () => {
    it('should return empty string for non-object values', () => {
      expect(extractDatabaseErrorMessage(null)).toBe('');
      expect(extractDatabaseErrorMessage('raw')).toBe('');
    });

    it('should combine top-level message and driverError.message', () => {
      expect(
        extractDatabaseErrorMessage({
          message: 'QueryFailedError',
          driverError: { message: 'Duplicate entry for key IDX_users_email' },
        }),
      ).toBe('QueryFailedError Duplicate entry for key IDX_users_email');
    });
  });
});
