import { ConfigService } from '@nestjs/config';

import { MinioObjectStorageAdapter } from '../../../src/integrations/object-storage/minio-object-storage.adapter';

function adapter(publicUrl?: string) {
  const values: Record<string, unknown> = {
    'objectStorage.bucket': 'needle-evidence',
    'objectStorage.endpoint': 'localhost',
    'objectStorage.port': 9000,
    'objectStorage.useSsl': false,
    'objectStorage.accessKey': 'access',
    'objectStorage.secretKey': 'secret-secret',
    'objectStorage.publicUrl': publicUrl,
  };
  const config = {
    get: (key: string, fallback?: unknown) => values[key] ?? fallback,
    getOrThrow: (key: string) => values[key],
  } as unknown as ConfigService;

  return new MinioObjectStorageAdapter(config);
}

describe('MinioObjectStorageAdapter.presignedGetUrl', () => {
  it('signs for the public host when MINIO_PUBLIC_URL is set', async () => {
    const url = new URL(
      await adapter('http://192.168.43.175:9000').presignedGetUrl('exchanges/a.jpg', 900),
    );

    expect(url.host).toBe('192.168.43.175:9000');
    expect(url.pathname).toBe('/needle-evidence/exchanges/a.jpg');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('900');
    // The signature covers the host, so it is only valid for the address signed.
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('host');
  });

  it('uses https and the default port for an https public URL', async () => {
    const url = new URL(
      await adapter('https://files.example.com').presignedGetUrl('exchanges/a.jpg', 60),
    );

    expect(url.protocol).toBe('https:');
    expect(url.host).toBe('files.example.com');
  });
});
