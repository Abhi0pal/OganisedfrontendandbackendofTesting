import { SetMetadata } from '@nestjs/common';

export const RESOURCE_CODE_KEY = 'resourceCode';
export const Resource = (code: string) => SetMetadata(RESOURCE_CODE_KEY, code);
