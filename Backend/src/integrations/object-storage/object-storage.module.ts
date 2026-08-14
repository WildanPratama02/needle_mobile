import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MinioObjectStorageAdapter } from './minio-object-storage.adapter';
import { OBJECT_STORAGE } from './object-storage.port';

/**
 * Binds the storage port to its MinIO implementation. Domain modules import
 * this module and inject `OBJECT_STORAGE`, so replacing the provider is a
 * one-line change here (Docs/19 §5).
 */
@Module({
  imports: [ConfigModule],
  providers: [{ provide: OBJECT_STORAGE, useClass: MinioObjectStorageAdapter }],
  exports: [OBJECT_STORAGE],
})
export class ObjectStorageModule {}
