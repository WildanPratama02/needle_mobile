import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

import { ObjectStoragePort, StoredObject } from './object-storage.port';

/**
 * The region MinIO serves by default. Given explicitly to the signing client
 * so presigning is a pure local computation — without it the client first
 * asks the server for the bucket region, over the public address.
 */
const MINIO_DEFAULT_REGION = 'us-east-1';

/**
 * MinIO implementation of {@link ObjectStoragePort} (Backend/CLAUDE.md §6).
 *
 * The only file in the codebase that knows MinIO exists.
 *
 * **Two addresses.** The backend reaches MinIO at `MINIO_ENDPOINT` (often
 * `localhost`, next to it). Clients — the trolley tablet, a browser on
 * another machine — cannot use that address, and a presigned URL's signature
 * covers its host, so the link cannot simply be rewritten afterwards. When
 * `MINIO_PUBLIC_URL` is set, presigned links are signed by a second client
 * configured for that public host; uploads and deletes keep using the
 * internal one.
 */
@Injectable()
export class MinioObjectStorageAdapter implements ObjectStoragePort, OnModuleInit {
  private readonly logger = new Logger(MinioObjectStorageAdapter.name);
  private readonly client: Client;
  private readonly signingClient: Client;
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

    const publicUrl = config.get<string>('objectStorage.publicUrl');
    this.signingClient = publicUrl
      ? MinioObjectStorageAdapter.clientFor(
          new URL(publicUrl),
          config.getOrThrow<string>('objectStorage.accessKey'),
          config.getOrThrow<string>('objectStorage.secretKey'),
        )
      : this.client;
  }

  private static clientFor(url: URL, accessKey: string, secretKey: string): Client {
    const useSSL = url.protocol === 'https:';
    return new Client({
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : useSSL ? 443 : 80,
      useSSL,
      accessKey,
      secretKey,
      region: MINIO_DEFAULT_REGION,
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
    return this.signingClient.presignedGetObject(this.bucket, key, expirySeconds);
  }

  async remove(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
