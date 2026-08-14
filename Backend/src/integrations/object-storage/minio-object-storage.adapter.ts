import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

import { ObjectStoragePort, StoredObject } from './object-storage.port';

/**
 * MinIO implementation of {@link ObjectStoragePort} (Backend/CLAUDE.md §6).
 *
 * The only file in the codebase that knows MinIO exists.
 */
@Injectable()
export class MinioObjectStorageAdapter implements ObjectStoragePort, OnModuleInit {
  private readonly logger = new Logger(MinioObjectStorageAdapter.name);
  private readonly client: Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('objectStorage.bucket', 'needle-evidence');
    this.client = new Client({
      endPoint: config.get<string>('objectStorage.endpoint', 'localhost'),
      port: config.get<number>('objectStorage.port', 9000),
      useSSL: config.get<boolean>('objectStorage.useSsl', false),
      accessKey: config.getOrThrow<string>('objectStorage.accessKey'),
      secretKey: config.getOrThrow<string>('objectStorage.secretKey'),
    });
  }

  /**
   * `minio-init` in docker-compose already creates the bucket; this covers
   * environments that do not run that one-shot. A failure is logged rather
   * than thrown — the API should still serve every non-evidence endpoint if
   * object storage is down.
   */
  async onModuleInit(): Promise<void> {
    try {
      if (!(await this.client.bucketExists(this.bucket))) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created bucket ${this.bucket}`);
      }
    } catch (error) {
      this.logger.error(`Object storage unavailable: ${(error as Error).message}`);
    }
  }

  async put(key: string, body: Buffer, contentType: string): Promise<StoredObject> {
    const result = await this.client.putObject(this.bucket, key, body, body.length, {
      'Content-Type': contentType,
    });

    return {
      storageKey: key,
      size: body.length,
      // MinIO returns the object etag, which for a single-part upload is its MD5.
      checksum: result.etag,
    };
  }

  presignedGetUrl(key: string, expirySeconds: number): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }

  async remove(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
