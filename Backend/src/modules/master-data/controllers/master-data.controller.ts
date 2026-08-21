import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExchangeType, Factory, Location, StorageMapping, NeedleType, Trolley } from '@prisma/client';

import { AUDIT_ACTIONS, Audit } from '../../../common/decorators/audit.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import {
  MasterDataQueryDto,
  ScopedMasterDataQueryDto,
  StorageMappingQueryDto,
} from '../dto/master-data-query.dto';
import { CreateStorageMappingDto, UpdateStorageMappingDto } from '../dto/master-data-request.dto';
import {
  ExchangeTypeResponseDto,
  FactoryResponseDto,
  LocationResponseDto,
  NeedleTypeResponseDto,
  StorageMappingResponseDto,
  TrolleyResponseDto,
} from '../dto/master-data-response.dto';
import { MasterDataService } from '../services/master-data.service';

/**
 * Master data (`.scratch/master-data/spec.md`, extended by
 * `.scratch/master-data-storage-rfid/spec.md`).
 *
 * Five read-only collections plus `StorageMapping`'s reads and writes, one
 * controller each, because a Nest controller owns one path. `Employee`'s
 * controller moved to the `employee` module (decision #15) — this file no
 * longer serves it.
 *
 * Reads require `MASTER_VIEW`; `StorageMapping`'s writes require
 * `MASTER_EDIT` and are audited under `CHANGE_MASTER`. The other five
 * collections stay read-only and unaudited — a trail that records reads
 * stops being a record of what changed.
 */

const NOT_FOUND = { status: 404, description: 'No such row' };
const FORBIDDEN = { status: 403, description: 'Missing MASTER_VIEW, or outside factory scope' };

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

@ApiTags('master-data')
@ApiBearerAuth()
@Controller({ path: 'factories', version: '1' })
export class FactoryController {
  constructor(private readonly masterData: MasterDataService) {}

  static toResponse(row: Factory): FactoryResponseDto {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      status: row.status,
      description: row.description,
      timezone: row.timezone,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @Paginated()
  @ApiOperation({ summary: 'List factories within the caller factory scope' })
  @ApiResponse({ status: 200, type: [FactoryResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: ScopedMasterDataQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const { items, ...page } = await this.masterData.findFactories(query, user);
    return { items: items.map((item) => FactoryController.toResponse(item)), ...page };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @ApiOperation({ summary: 'Fetch one factory' })
  @ApiResponse({ status: 200, type: FactoryResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return FactoryController.toResponse(await this.masterData.findFactory(id, user));
  }
}

@ApiTags('master-data')
@ApiBearerAuth()
@Controller({ path: 'locations', version: '1' })
export class LocationController {
  constructor(private readonly masterData: MasterDataService) {}

  static toResponse(row: Location): LocationResponseDto {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      status: row.status,
      factoryId: row.factoryId,
      locationType: row.locationType,
      parentLocationId: row.parentLocationId,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @Paginated()
  @ApiOperation({ summary: 'List stock locations within the caller factory scope' })
  @ApiResponse({ status: 200, type: [LocationResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: ScopedMasterDataQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const { items, ...page } = await this.masterData.findLocations(query, user);
    return { items: items.map((item) => LocationController.toResponse(item)), ...page };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @ApiOperation({ summary: 'Fetch one location' })
  @ApiResponse({ status: 200, type: LocationResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return LocationController.toResponse(await this.masterData.findLocation(id, user));
  }
}

@ApiTags('master-data')
@ApiBearerAuth()
@Controller({ path: 'trolleys', version: '1' })
export class TrolleyController {
  constructor(private readonly masterData: MasterDataService) {}

  static toResponse(row: Trolley): TrolleyResponseDto {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      status: row.status,
      factoryId: row.factoryId,
      locationId: row.locationId,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @Paginated()
  @ApiOperation({ summary: 'List trolleys within the caller factory scope' })
  @ApiResponse({ status: 200, type: [TrolleyResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: ScopedMasterDataQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const { items, ...page } = await this.masterData.findTrolleys(query, user);
    return { items: items.map((item) => TrolleyController.toResponse(item)), ...page };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @ApiOperation({ summary: 'Fetch one trolley' })
  @ApiResponse({ status: 200, type: TrolleyResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return TrolleyController.toResponse(await this.masterData.findTrolley(id, user));
  }
}

@ApiTags('master-data')
@ApiBearerAuth()
@Controller({ path: 'needle-types', version: '1' })
export class NeedleTypeController {
  constructor(private readonly masterData: MasterDataService) {}

  static toResponse(row: NeedleType): NeedleTypeResponseDto {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      status: row.status,
      category: row.category,
      unit: row.unit,
      // Prisma Decimal serialises as a string; clients want a number and the
      // precision here (18,3 on a stock threshold) is nowhere near lossy.
      minimumStock: Number(row.minimumStock),
      description: row.description,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @Paginated()
  @ApiOperation({
    summary: 'List the needle type catalogue',
    description: 'Business-wide: needle types carry no factory, so no factory filter applies.',
  })
  @ApiResponse({ status: 200, type: [NeedleTypeResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: MasterDataQueryDto) {
    const { items, ...page } = await this.masterData.findNeedleTypes(query);
    return { items: items.map((item) => NeedleTypeController.toResponse(item)), ...page };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @ApiOperation({ summary: 'Fetch one needle type' })
  @ApiResponse({ status: 200, type: NeedleTypeResponseDto })
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string) {
    return NeedleTypeController.toResponse(await this.masterData.findNeedleType(id));
  }
}

@ApiTags('master-data')
@ApiBearerAuth()
@Controller({ path: 'exchange-types', version: '1' })
export class ExchangeTypeController {
  constructor(private readonly masterData: MasterDataService) {}

  static toResponse(row: ExchangeType): ExchangeTypeResponseDto {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      status: row.status,
      requiresFragmentValidation: row.requiresFragmentValidation,
      description: row.description,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @Paginated()
  @ApiOperation({
    summary: 'List the exchange type catalogue',
    description: 'Business-wide: exchange types carry no factory, so no factory filter applies.',
  })
  @ApiResponse({ status: 200, type: [ExchangeTypeResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: MasterDataQueryDto) {
    const { items, ...page } = await this.masterData.findExchangeTypes(query);
    return { items: items.map((item) => ExchangeTypeController.toResponse(item)), ...page };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @ApiOperation({ summary: 'Fetch one exchange type' })
  @ApiResponse({ status: 200, type: ExchangeTypeResponseDto })
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string) {
    return ExchangeTypeController.toResponse(await this.masterData.findExchangeType(id));
  }
}

@ApiTags('master-data')
@ApiBearerAuth()
@Controller({ path: 'storage-mappings', version: '1' })
export class StorageMappingController {
  constructor(private readonly masterData: MasterDataService) {}

  static toResponse(row: StorageMapping): StorageMappingResponseDto {
    return {
      id: row.id,
      trolleyId: row.trolleyId,
      exchangeTypeId: row.exchangeTypeId,
      storageLocationId: row.storageLocationId,
      status: row.status,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @Paginated()
  @ApiOperation({ summary: 'List storage mappings within the caller factory scope' })
  @ApiResponse({ status: 200, type: [StorageMappingResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: StorageMappingQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const { items, ...page } = await this.masterData.findStorageMappings(query, user);
    return { items: items.map((item) => StorageMappingController.toResponse(item)), ...page };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @ApiOperation({ summary: 'Fetch one storage mapping' })
  @ApiResponse({ status: 200, type: StorageMappingResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return StorageMappingController.toResponse(await this.masterData.findStorageMapping(id, user));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'StorageMapping')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assign a trolley + exchange type its used-needle storage location',
    description:
      'storageLocationId must be a USED_NEEDLE_STORAGE location in the same factory as the trolley.',
  })
  @ApiResponse({ status: 201, type: StorageMappingResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid storage location, or inactive exchange type' })
  @ApiResponse({ status: 409, description: 'A mapping for this trolley + exchange type already exists' })
  async create(@Body() dto: CreateStorageMappingDto, @CurrentUser() user: AuthenticatedUser) {
    return StorageMappingController.toResponse(await this.masterData.createStorageMapping(dto, user));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'StorageMapping')
  @ApiOperation({
    summary: 'Change a storage mapping\'s destination location',
    description:
      'Destination only — trolleyId/exchangeTypeId are the mapping\'s identity and are not editable here.',
  })
  @ApiResponse({ status: 200, type: StorageMappingResponseDto })
  @ApiResponse(NOT_FOUND)
  async update(
    @Param('id', uuid()) id: string,
    @Body() dto: UpdateStorageMappingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return StorageMappingController.toResponse(
      await this.masterData.updateStorageMapping(id, dto, user),
    );
  }
}
