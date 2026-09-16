import { randomUUID } from 'crypto';
import { extname } from 'path';

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { StockAdjustmentEvidence } from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import {
  OBJECT_STORAGE,
  ObjectStoragePort,
} from '../../../integrations/object-storage/object-storage.port';
import { InventoryService } from './inventory.service';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const PRESIGNED_URL_TTL_SECONDS = 15 * 60;

export interface EvidenceFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export type EvidenceWithUrl = StockAdjustmentEvidence & { url: string };

/**
 * Evidence for a manual Adjustment (`.scratch/inventory-operation-history/spec.md`
 * decision 4).
 *
 * Uploaded before the adjustment exists, so a file is stored unattached and
 * `InventoryService.adjustStock` claims it in the same transaction as the
 * balance write. The binary goes to object storage through the port; the
 * database keeps only metadata and the key (Docs/11 §17).
 */
@Injectable()
export class AdjustmentEvidenceService {
  private readonly logger = new Logger(AdjustmentEvidenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
  ) {}

  async upload(
    factoryId: string,
    file: EvidenceFile,
    user: AuthenticatedUser,
  ): Promise<StockAdjustmentEvidence> {
    assertFactoryScope(user, factoryId);
    await this.inventory.assertActiveFactory(factoryId);

    if (!(file.mimetype in EXTENSIONS)) {
      throw new BadRequestException(
        `Unsupported content type ${file.mimetype}; expected one of ${Object.keys(EXTENSIONS).join(', ')}`,
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException(`File exceeds ${MAX_FILE_BYTES / (1024 * 1024)} MB`);
    }

    // The id keys the object, so it is chosen before the upload; the row is
    // only written once the object exists, so a failed upload leaves nothing
    // an adjustment could claim.
    const id = randomUUID();
    const storageKey = AdjustmentEvidenceService.buildKey(factoryId, id, file);

    let stored;
    try {
      stored = await this.storage.put(storageKey, file.buffer, file.mimetype);
    } catch (error) {
      this.logger.error(`Adjustment evidence upload failed: ${(error as Error).message}`);
      throw new InternalServerErrorException('Evidence could not be stored');
    }

    return this.prisma.stockAdjustmentEvidence.create({
      data: {
        id,
        factoryId,
        storageKey: stored.storageKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum: stored.checksum,
        uploadedBy: user.id,
      },
    });
  }

  /** Short-lived read URLs; binaries never pass through this API. */
  withUrls(rows: StockAdjustmentEvidence[]): Promise<EvidenceWithUrl[]> {
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        url: await this.storage.presignedGetUrl(row.storageKey, PRESIGNED_URL_TTL_SECONDS),
      })),
    );
  }

  /** `adjustments/{yyyy}/{mm}/{factoryId}/{evidenceId}{ext}`. */
  private static buildKey(factoryId: string, id: string, file: EvidenceFile): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const extension = extname(file.originalname).toLowerCase() || EXTENSIONS[file.mimetype];

    return `adjustments/${year}/${month}/${factoryId}/${id}${extension}`;
  }
}
