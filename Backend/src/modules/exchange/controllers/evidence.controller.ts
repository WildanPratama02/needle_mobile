import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EvidenceType } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import {
  EvidenceListItemDto,
  UploadEvidenceDto,
  UploadEvidenceResponseDto,
} from '../dto/evidence.dto';
import { EvidenceService, UploadedFile as StoredFile } from '../services/evidence.service';

/**
 * Evidence capture for an exchange (Docs/12 §/evidence).
 *
 * `multipart/form-data`, so the photo never becomes a base64 payload in JSON.
 * The binary goes to MinIO through the storage port; the database keeps only
 * metadata and the key (Docs/11 §17).
 */
@ApiTags('exchanges')
@ApiBearerAuth()
@Controller({ path: 'exchanges', version: '1' })
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  @Post(':id/evidence')
  @RequirePermissions(PERMISSIONS.EXCHANGE_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'evidenceType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        evidenceType: { type: 'string', enum: Object.values(EvidenceType) },
        capturedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload one evidence photo',
    description:
      'Advances the exchange to EVIDENCE_CAPTURED on the upload that completes the mandatory set: OLD_NEEDLE always, BROKEN_FRAGMENT when fragment status is FOUND.',
  })
  @ApiResponse({ status: 201, type: UploadEvidenceResponseDto })
  @ApiResponse({ status: 409, description: 'Exchange is not in a state that accepts evidence' })
  async upload(
    @Param('id') id: string,
    @Body() dto: UploadEvidenceDto,
    @UploadedFile() file: StoredFile | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UploadEvidenceResponseDto> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const { evidence, exchangeStatus } = await this.evidence.upload(
      id,
      dto.evidenceType,
      file,
      dto.capturedAt ?? new Date(),
      user,
    );

    return {
      id: evidence.id,
      exchangeId: evidence.exchangeId,
      evidenceType: evidence.evidenceType,
      storageKey: evidence.storageKey,
      status: evidence.status,
      fileName: evidence.fileName,
      mimeType: evidence.mimeType,
      checksum: evidence.checksum,
      capturedAt: evidence.capturedAt,
      uploadedAt: evidence.uploadedAt,
      exchangeStatus,
      outstanding: await this.evidence.outstanding(id, user),
    };
  }

  @Get(':id/evidence')
  @RequirePermissions(PERMISSIONS.EXCHANGE_VIEW)
  @ApiOperation({ summary: 'List evidence with short-lived read URLs' })
  @ApiResponse({ status: 200, type: [EvidenceListItemDto] })
  async list(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvidenceListItemDto[]> {
    const items = await this.evidence.list(id, user);

    return items.map((item) => ({
      id: item.id,
      exchangeId: item.exchangeId,
      evidenceType: item.evidenceType,
      storageKey: item.storageKey,
      status: item.status,
      fileName: item.fileName,
      mimeType: item.mimeType,
      checksum: item.checksum,
      capturedAt: item.capturedAt,
      uploadedAt: item.uploadedAt,
      url: item.url,
    }));
  }
}
