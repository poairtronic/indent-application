import { SetMetadata } from '@nestjs/common';

export const CACHE_PREFIX_METADATA = 'cache:prefix';
export const CACHE_TTL_METADATA = 'cache:ttl';

export const Cache = (prefix: string, ttlSeconds = 60) => {
  return (target: any, key: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    SetMetadata(CACHE_PREFIX_METADATA, prefix)(target, key, descriptor);
    SetMetadata(CACHE_TTL_METADATA, ttlSeconds)(target, key, descriptor);
  };
};
