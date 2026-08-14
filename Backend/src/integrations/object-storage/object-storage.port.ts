/**
 * The port the domain talks to. `exchange` depends on this interface, never on
 * MinIO — swapping to S3 or anything else must not touch a domain module
 * (Backend/CLAUDE.md §7).
 */
export interface StoredObject {
  storageKey: string;
  size: number;
  /** Provider-reported content hash, when it gives one. */
  checksum?: string;
}

export interface ObjectStoragePort {
  put(key: string, body: Buffer, contentType: string): Promise<StoredObject>;

  /** Time-limited read URL, so binaries never stream through this API. */
  presignedGetUrl(key: string, expirySeconds: number): Promise<string>;

  remove(key: string): Promise<void>;
}

/** Injection token — an interface has no runtime identity to inject by. */
export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');
