export const MYSQL_DUP_ENTRY_CODE = 'ER_DUP_ENTRY';
export const MYSQL_DUP_ENTRY_ERRNO = 1062;

export interface DatabaseErrorShape {
  code?: string;
  errno?: number;
  message?: string;
  driverError?: {
    code?: string;
    errno?: number;
    message?: string;
  };
}

export function isDuplicateEntryError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }

  const errorObj = err as DatabaseErrorShape;
  return (
    errorObj.code === MYSQL_DUP_ENTRY_CODE ||
    errorObj.errno === MYSQL_DUP_ENTRY_ERRNO ||
    errorObj.driverError?.code === MYSQL_DUP_ENTRY_CODE ||
    errorObj.driverError?.errno === MYSQL_DUP_ENTRY_ERRNO ||
    (typeof errorObj.message === 'string' &&
      (errorObj.message.includes('Duplicate entry') ||
        errorObj.message.includes(MYSQL_DUP_ENTRY_CODE)))
  );
}

export function extractDatabaseErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return '';
  }

  const errorObj = err as DatabaseErrorShape;
  return `${errorObj.message ?? ''} ${errorObj.driverError?.message ?? ''}`;
}
