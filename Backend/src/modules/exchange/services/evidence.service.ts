import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EvidenceStatus, EvidenceType, ExchangeEvidence, ExchangeState } from '@prisma/client';
import { extname } from 'path';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import {
  OBJECT_STORAGE,
  ObjectStoragePort,
} from '../../../integrations/object-storage/object-storage.port';
import { ExchangeRepository, ExchangeWithContext } from '../repositories/exchange.repository';
import { InvalidTransitionError, resolveTransition } from './exchange-state-machine';
import { isEvidenceComplete, missingEvidenceTypes } from './evidence-policy';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const PRESIGNED_URL_TTL_SECONDS = 15 * 60;

/**
 * States in which evidence may be uploaded.
 *
 * The first three are where evidence is actually expected. `EVIDENCE_CAPTURED`
 * is included so an optional `OTHER` photo can still be added after the
 * mandatory set is complete, without attempting a second transition.
 */
const UPLOAD_ALLOWED_STATES: ExchangeState[] = [
  ExchangeState.EXCHANGE_TYPE_SELECTED,
  ExchangeState.FRAGMENT_CHECK,
  ExchangeState.CONFIRMATION_PENDING,
  ExchangeState.EVIDENCE_CAPTURED,
];

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exchanges: ExchangeRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
  ) {}

  private async loadOrFail(id: string, user: AuthenticatedUser): Promise<ExchangeWithContext> {
    const exchange = await this.exchanges.findWithContext(id);

    if (!exchange) {
      throw new NotFoundException(`Exchange ${id} not found`);
    }

    assertFactoryScope(user, exchange.factoryId);

    return exchange;
  }

  /**
   * Stores one photo and advances the exchange if that completes the mandatory
   * set (round 4 Q9).
   *
   * The transition fires only on the upload that first satisfies the policy.
   * `CAPTURE_EVIDENCE` is a single transition in the state machine, but several
   * uploads can precede it, and re-running it from `EVIDENCE_CAPTURED` would
   * throw — so the state is consulted before the machine is.
   */
  async upload(
    exchangeId: string,
    evidenceType: EvidenceType,
    file: UploadedFile,
    capturedAt: Date,
    user: AuthenticatedUser,
  ): Promise<{ evidence: ExchangeEvidence; exchangeStatus: ExchangeState }> {
    const exchange = await this.loadOrFail(exchangeId, user);

    if (!UPLOAD_ALLOWED_STATES.includes(exchange.state)) {
      throw new ConflictException(
        `Evidence cannot be uploaded while the exchange is ${exchange.state}`,
      );
    }

    // A BROKEN exchange must record its fragment status first, otherwise the
    // required set cannot even be computed.
    if (
      exchange.state === ExchangeState.EXCHANGE_TYPE_SELECTED &&
      exchange.exchangeType?.requiresFragmentValidation
    ) {
      throw new ConflictException('Record the fragment status before uploading evidence');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported content type ${file.mimetype}; expected one of ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException(`File exceeds ${MAX_FILE_BYTES / (1024 * 1024)} MB`);
    }

    // The row is created first so its id can key the object, and so a failed
    // upload leaves a FAILED record rather than a silent gap.
    const pending = await this.prisma.exchangeEvidence.create({
      data: {
        exchangeId,
        evidenceType,
        storageKey: '',
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        capturedAt,
        uploadedBy: user.id,
        status: EvidenceStatus.PENDING,
      },
    });

    const storageKey = EvidenceService.buildKey(exchange, pending.id, file.originalname);

    let stored;
    try {
      stored = await this.storage.put(storageKey, file.buffer, file.mimetype);
    } catch (error) {
      await this.prisma.exchangeEvidence.update({
        where: { id: pending.id },
        data: { status: EvidenceStatus.FAILED, storageKey },
      });
      this.logger.error(`Evidence upload failed for ${exchangeId}: ${(error as Error).message}`);
      throw new InternalServerErrorException('Evidence could not be stored');
    }

    const evidence = await this.prisma.exchangeEvidence.update({
      where: { id: pending.id },
      data: {
        storageKey: stored.storageKey,
        checksum: stored.checksum,
        fileSize: stored.size,
        status: EvidenceStatus.UPLOADED,
        uploadedAt: new Date(),
      },
    });

    const exchangeStatus = await this.advanceIfComplete(exchange);

    return { evidence, exchangeStatus };
  }

  /**
   * Moves the exchange to `EVIDENCE_CAPTURED` once every mandatory type is
   * present. Already-captured exchanges are left alone, which is what makes a
   * later optional `OTHER` upload safe.
   */
  private async advanceIfComplete(exchange: ExchangeWithContext): Promise<ExchangeState> {
    if (exchange.state === ExchangeState.EVIDENCE_CAPTURED) {
      return exchange.state;
    }

    const uploaded = await this.prisma.exchangeEvidence.findMany({
      where: { exchangeId: exchange.id, status: EvidenceStatus.UPLOADED },
      select: { evidenceType: true },
    });

    if (
      !isEvidenceComplete(
        exchange.fragmentStatus,
        uploaded.map((row) => row.evidenceType),
      )
    ) {
      return exchange.state;
    }

    try {
      const [target] = resolveTransition('CAPTURE_EVIDENCE', {
        state: exchange.state,
        exchangeTypeCode: exchange.exchangeType?.code ?? null,
        fragmentStatus: exchange.fragmentStatus,
        confirmationStatus: exchange.confirmation?.status ?? null,
      });

      await this.prisma.exchange.update({ where: { id: exchange.id }, data: { state: target } });

      return target;
    } catch (error) {
      if (error instanceof InvalidTransitionError) {
        // Mandatory evidence is present but the exchange is still held back —
        // a confirmation awaiting approval, most often. The upload stands; the
        // transition simply waits.
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  /** `exchanges/{yyyy}/{mm}/{exchangeId}/{evidenceId}{ext}` — Docs/12 §/evidence. */
  private static buildKey(
    exchange: ExchangeWithContext,
    evidenceId: string,
    originalName: string,
  ): string {
    const created = exchange.createdAt;
    const year = created.getUTCFullYear();
    const month = String(created.getUTCMonth() + 1).padStart(2, '0');
    const extension = extname(originalName).toLowerCase() || '.jpg';

    return `exchanges/${year}/${month}/${exchange.id}/${evidenceId}${extension}`;
  }

  /** Lists evidence with short-lived read URLs; binaries never pass through this API. */
  async list(exchangeId: string, user: AuthenticatedUser) {
    await this.loadOrFail(exchangeId, user);

    const evidence = await this.prisma.exchangeEvidence.findMany({
      where: { exchangeId },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      evidence.map(async (item) => ({
        ...item,
        url:
          item.status === EvidenceStatus.UPLOADED
            ? await this.storage.presignedGetUrl(item.storageKey, PRESIGNED_URL_TTL_SECONDS)
            : null,
      })),
    );
  }

  /** What `/complete` and the UI need to know is still outstanding. */
  async outstanding(exchangeId: string, user: AuthenticatedUser): Promise<EvidenceType[]> {
    const exchange = await this.loadOrFail(exchangeId, user);
    const uploaded = await this.prisma.exchangeEvidence.findMany({
      where: { exchangeId, status: EvidenceStatus.UPLOADED },
      select: { evidenceType: true },
    });

    return missingEvidenceTypes(
      exchange.fragmentStatus,
      uploaded.map((row) => row.evidenceType),
    );
  }
}
