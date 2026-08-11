import { Module, Global } from '@nestjs/common';
import { SupabaseStorageAdapter } from './adapters/supabase-storage.adapter';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';

@Global()
@Module({
  providers: [
    {
      provide: 'STORAGE_ADAPTER',
      useFactory: () => {
        if (process.env.NODE_ENV === 'production') {
          return new SupabaseStorageAdapter();
        }

        const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (useSupabase) {
          return new SupabaseStorageAdapter();
        }

        return new LocalStorageAdapter();
      },
    },
  ],
  exports: ['STORAGE_ADAPTER'],
})
export class StorageModule {}
