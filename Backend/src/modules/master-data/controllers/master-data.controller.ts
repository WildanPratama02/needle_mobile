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
import {
  EntityStatus,
  ExchangeType,
  Factory,
  Location,
  NeedleType,
  StorageMapping,
  Trolley,
} from '@prisma/client';

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
import {
  CreateFactoryDto,
  CreateLocationDto,
  CreateNeedleTypeDto,
  CreateStorageMappingDto,
  CreateTrolleyDto,
  UpdateFactoryDto,
  UpdateLocationDto,
  UpdateNeedleTypeDto,
  UpdateStorageMappingDto,
  UpdateTrolleyDto,
} from '../dto/master-data-request.dto';
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
 * One controller per collection, because a Nest controller owns one path.
 * `Employee`'s controller moved to the `employee` module (decision #15) —
 * this file no longer serves it.
 *
 * Reads require `MASTER_VIEW` and are unaudited — a trail that records reads
 * stops being a record of what changed. Writes (`StorageMapping`, and
 * `.scratch/admin-panel-crud/issues/01`–`03`'s `NeedleType`, `Factory`,
 * `Trolley`, and `09`'s `Location`) require `MASTER_EDIT` and are audited
 * under `CHANGE_MASTER`. `ExchangeType` stays read-only.
 */

const NOT_FOUND = { status: 404, description: 'No such row' };
const FORBIDDEN = { status: 403, description: 'Missing MASTER_VIEW, or outside factory scope' };
const EDIT_FORBIDDEN = {
  status: 403,
  description: 'Missing MASTER_EDIT, or outside factory scope',
};
const DUPLICATE_CODE = { status: 409, description: 'code already in use' };

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

  @Post()
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'Factory')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a factory',
    description: 'The caller is granted factory scope to the new factory in the same transaction.',
  })
  @ApiResponse({ status: 201, type: FactoryResponseDto })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(DUPLICATE_CODE)
  async create(@Body() dto: CreateFactoryDto, @CurrentUser() user: AuthenticatedUser) {
    return FactoryController.toResponse(await this.masterData.createFactory(dto, user));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'Factory')
  @ApiOperation({ summary: 'Edit a factory — code is immutable' })
  @ApiResponse({ status: 200, type: FactoryResponseDto })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async update(
    @Param('id', uuid()) id: string,
    @Body() dto: UpdateFactoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return FactoryController.toResponse(await this.masterData.updateFactory(id, dto, user));
  }

  @Post(':id/activate')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'Factory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a factory' })
  @ApiResponse({ status: 200, type: FactoryResponseDto })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async activate(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return FactoryController.toResponse(
      await this.masterData.setFactoryStatus(id, EntityStatus.ACTIVE, user),
    );
  }

  @Post(':id/deactivate')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'Factory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate a factory',
    description:
      'Blocks new exchanges and inventory writes in this factory. Trolleys, locations and devices are not cascaded.',
  })
  @ApiResponse({ status: 200, type: FactoryResponseDto })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async deactivate(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return FactoryController.toResponse(
      await this.masterData.setFactoryStatus(id, EntityStatus.INACTIVE, user),
    );
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

  @Post()
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'Location')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a WAREHOUSE or USED_NEEDLE_STORAGE location',
    description:
      'TROLLEY locations are created with their trolley (POST /trolleys). factoryId must be ACTIVE and in scope; a parent must be a WAREHOUSE in the same factory.',
  })
  @ApiResponse({ status: 201, type: LocationResponseDto })
  @ApiResponse({ status: 400, description: 'Inactive factory, TROLLEY type, or invalid parent' })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse({ status: 409, description: 'code already in use in this factory' })
  async create(@Body() dto: CreateLocationDto, @CurrentUser() user: AuthenticatedUser) {
    return LocationController.toResponse(await this.masterData.createLocation(dto, user));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'Location')
  @ApiOperation({
    summary: 'Edit a location — name, parent, status',
    description:
      'code, factoryId and locationType are immutable. TROLLEY locations are managed through /trolleys.',
  })
  @ApiResponse({ status: 200, type: LocationResponseDto })
  @ApiResponse({ status: 400, description: 'TROLLEY location, or invalid parent' })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  @ApiResponse({
    status: 409,
    description: 'Deactivating a storage location that an active storage mapping still targets',
  })
  async update(
    @Param('id', uuid()) id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return LocationController.toResponse(await this.masterData.updateLocation(id, dto, user));
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

  @Post()
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'Trolley')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a trolley',
    description:
      'Creates the trolley and its own TROLLEY stock location (ADR-003). factoryId must be ACTIVE and in scope.',
  })
  @ApiResponse({ status: 201, type: TrolleyResponseDto })
  @ApiResponse({ status: 400, description: 'Inactive factory' })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(DUPLICATE_CODE)
  async create(@Body() dto: CreateTrolleyDto, @CurrentUser() user: AuthenticatedUser) {
    return TrolleyController.toResponse(await this.masterData.createTrolley(dto, user));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'Trolley')
  @ApiOperation({
    summary: 'Edit a trolley — name, location, status',
    description:
      'code and factoryId are immutable. Status changes go through here; no activate/deactivate pair.',
  })
  @ApiResponse({ status: 200, type: TrolleyResponseDto })
  @ApiResponse({ status: 400, description: 'locationId is not a TROLLEY location in this factory' })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  @ApiResponse({ status: 409, description: 'locationId already belongs to another trolley' })
  async update(
    @Param('id', uuid()) id: string,
    @Body() dto: UpdateTrolleyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return TrolleyController.toResponse(await this.masterData.updateTrolley(id, dto, user));
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

  @Post()
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'NeedleType')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a needle type' })
  @ApiResponse({ status: 201, type: NeedleTypeResponseDto })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(DUPLICATE_CODE)
  async create(@Body() dto: CreateNeedleTypeDto) {
    return NeedleTypeController.toResponse(await this.masterData.createNeedleType(dto));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'NeedleType')
  @ApiOperation({ summary: 'Edit a needle type — code is immutable' })
  @ApiResponse({ status: 200, type: NeedleTypeResponseDto })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async update(@Param('id', uuid()) id: string, @Body() dto: UpdateNeedleTypeDto) {
    return NeedleTypeController.toResponse(await this.masterData.updateNeedleType(id, dto));
  }

  @Post(':id/activate')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'NeedleType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a needle type' })
  @ApiResponse({ status: 200, type: NeedleTypeResponseDto })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async activate(@Param('id', uuid()) id: string) {
    return NeedleTypeController.toResponse(
      await this.masterData.setNeedleTypeStatus(id, EntityStatus.ACTIVE),
    );
  }

  @Post(':id/deactivate')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'NeedleType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate a needle type',
    description: 'Blocks new use; historical exchanges and stock movements are untouched.',
  })
  @ApiResponse({ status: 200, type: NeedleTypeResponseDto })
  @ApiResponse(EDIT_FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async deactivate(@Param('id', uuid()) id: string) {
    return NeedleTypeController.toResponse(
      await this.masterData.setNeedleTypeStatus(id, EntityStatus.INACTIVE),
    );
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
  @ApiResponse({
    status: 409,
    description: 'A mapping for this trolley + exchange type already exists',
  })
  async create(@Body() dto: CreateStorageMappingDto, @CurrentUser() user: AuthenticatedUser) {
    return StorageMappingController.toResponse(
      await this.masterData.createStorageMapping(dto, user),
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'StorageMapping')
  @ApiOperation({
    summary: "Change a storage mapping's destination location",
    description:
      "Destination only — trolleyId/exchangeTypeId are the mapping's identity and are not editable here.",
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
