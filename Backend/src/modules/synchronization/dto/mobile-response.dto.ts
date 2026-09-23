import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfirmationStatus, DeviceStatus } from '@prisma/client';

import { ApiErrorBodyDto } from '../../../common/dto/api-response.dto';
import { ExchangeResponseDto } from '../../exchange/dto/exchange-response.dto';
import { SYNC_COMMAND_TYPES, SYNC_RESULT_STATUSES } from '../sync.constants';

export class MasterDataVersionsDto {
  @ApiProperty({ example: 'a1b2c3d4e5f60718' })
  needleTypes!: string;

  @ApiProperty({ example: '0f1e2d3c4b5a6978' })
  exchangeTypes!: string;

  @ApiProperty({ example: '1122334455667788' })
  storageMappings!: string;
}

class BootstrapDeviceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'TAB-A-01' })
  deviceCode!: string;

  @ApiProperty({ example: 'Tablet A-01' })
  deviceName!: string;

  @ApiProperty({ enum: DeviceStatus })
  status!: DeviceStatus;

  @ApiPropertyOptional({ nullable: true })
  appVersion!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastSeenAt!: Date | null;
}

class BootstrapFactoryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: 'Asia/Jakarta' })
  timezone!: string;
}

class BootstrapTrolleyDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uuid' })
  locationId!: string;
}

export class BootstrapExchangeTypeDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'BROKEN' })
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  requiresFragmentValidation!: boolean;
}

export class BootstrapNeedleTypeDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  category!: string | null;

  @ApiProperty({ example: 'PCS' })
  unit!: string;

  @ApiProperty({ example: '10.000', description: 'Decimal as a string' })
  minimumStock!: string;
}

export class BootstrapStorageMappingDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  exchangeTypeId!: string;

  @ApiProperty({ format: 'uuid' })
  storageLocationId!: string;

  @ApiProperty()
  storageLocationCode!: string;

  @ApiProperty()
  storageLocationName!: string;
}

/**
 * `GET /mobile/bootstrap` (Docs/12 §18). A collection is `null` when the
 * version the tablet sent is still current — "keep your cache".
 */
export class BootstrapResponseDto {
  @ApiProperty({ type: BootstrapDeviceDto })
  device!: BootstrapDeviceDto;

  @ApiProperty({ type: BootstrapFactoryDto })
  factory!: BootstrapFactoryDto;

  @ApiProperty({ type: BootstrapTrolleyDto })
  trolley!: BootstrapTrolleyDto;

  @ApiProperty({ type: [BootstrapExchangeTypeDto], nullable: true })
  exchangeTypes!: BootstrapExchangeTypeDto[] | null;

  @ApiProperty({ type: [BootstrapNeedleTypeDto], nullable: true })
  needleTypes!: BootstrapNeedleTypeDto[] | null;

  @ApiProperty({ type: [BootstrapStorageMappingDto], nullable: true })
  storageMappings!: BootstrapStorageMappingDto[] | null;

  @ApiProperty({ type: MasterDataVersionsDto })
  masterDataVersions!: MasterDataVersionsDto;

  @ApiProperty()
  serverTime!: Date;

  @ApiProperty({ description: 'Opaque; pass to the first POST /mobile/sync' })
  syncCursor!: string;
}

/** An exchange as the tablet reconciles it: the §10 shape plus its own key. */
export class MobileExchangeDto extends ExchangeResponseDto {
  @ApiProperty({ example: 'tablet-generated-uuid' })
  clientTransactionId!: string;

  @ApiPropertyOptional({ enum: ConfirmationStatus, nullable: true })
  confirmationStatus!: ConfirmationStatus | null;
}

export class SyncCommandResultDto {
  @ApiProperty()
  commandId!: string;

  @ApiProperty()
  clientTransactionId!: string;

  @ApiProperty({ enum: SYNC_COMMAND_TYPES })
  commandType!: string;

  @ApiProperty({ enum: SYNC_RESULT_STATUSES })
  status!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, description: 'Server exchange id' })
  referenceId!: string | null;

  @ApiPropertyOptional({ type: ApiErrorBodyDto, description: 'Present on REJECTED and FAILED' })
  error?: ApiErrorBodyDto;

  @ApiPropertyOptional({ type: MobileExchangeDto, nullable: true })
  exchange!: MobileExchangeDto | null;
}

class SyncChangesDto {
  @ApiProperty({ type: [MobileExchangeDto] })
  exchanges!: MobileExchangeDto[];

  @ApiProperty({ description: 'More changes are waiting; sync again with nextCursor' })
  hasMore!: boolean;

  @ApiProperty({ type: MasterDataVersionsDto })
  masterDataVersions!: MasterDataVersionsDto;
}

export class SyncResponseDto {
  @ApiProperty({ type: [SyncCommandResultDto] })
  results!: SyncCommandResultDto[];

  @ApiProperty({ type: SyncChangesDto })
  changes!: SyncChangesDto;

  @ApiProperty()
  nextCursor!: string;

  @ApiProperty()
  serverTime!: Date;
}
