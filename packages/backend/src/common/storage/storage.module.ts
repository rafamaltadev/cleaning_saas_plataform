import { Module } from '@nestjs/common';
import { STORAGE_ADAPTER } from './storage.adapter';
import { LocalStorageAdapter } from './local-storage.adapter';

@Module({
  providers: [
    {
      provide: STORAGE_ADAPTER,
      useClass: LocalStorageAdapter,
    },
  ],
  exports: [STORAGE_ADAPTER],
})
export class StorageModule {}
