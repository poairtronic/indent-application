import { Module, Global } from '@nestjs/common';
import { R2StorageAdapter } from './adapters/r2-storage.adapter';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';

@Global()
@Module({
  providers: [
    {
      provide: 'STORAGE_ADAPTER',
      useFactory: () => {
        if (process.env.NODE_ENV === 'production') {
          return new R2StorageAdapter();
        }

        const useR2 = process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET_NAME;
        if (useR2) {
          return new R2StorageAdapter();
        }

        return new LocalStorageAdapter();
      },
    },
  ],
  exports: ['STORAGE_ADAPTER'],
})
export class StorageModule {}
