import { Header } from '@nestjs/common';

export const NoCacheHeaders = () => Header('Cache-Control', 'no-store');
