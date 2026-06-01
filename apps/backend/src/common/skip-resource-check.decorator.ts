import { SetMetadata } from '@nestjs/common';

export const SKIP_RESOURCE_CHECK_KEY = 'skipResourceCheck';
export const SkipResourceCheck = () => SetMetadata(SKIP_RESOURCE_CHECK_KEY, true);
