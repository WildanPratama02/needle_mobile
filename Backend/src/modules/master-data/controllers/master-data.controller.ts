import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Employee, ExchangeType, Factory, Location, NeedleType, Trolley } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { MasterDataQueryDto, ScopedMasterDataQueryDto } from '../dto/master-data-query.dto';
import {
  EmployeeResponseDto,
  ExchangeTypeResponseDto,
  FactoryResponseDto,
  LocationResponseDto,
  NeedleTypeResponseDto,
  TrolleyResponseDto,
} from '../dto/master-data-response.dto';
import { MasterDataService } from '../services/master-data.service';

/**
 * Read-only master data (`.scratch/master-data/spec.md`).
 *
 * Six collections, six controllers, because a Nest controller owns one path.
 * They share a file rather than a base class: each is small enough to read at a
 * glance, and inheriting decorated handlers costs more clarity than the six
 * repeated lines it would save.
 *
 * Every route requires `MASTER_VIEW` and nothing more. There is no write verb
 * anywhere in this module, so `CHANGE_MASTER` has nothing to gate yet.
 *
 * Not audited: these are lookups, and an audit trail that records reads stops
 * being a record of what changed.
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
@Controller({ path: 'employees', version: '1' })
export class EmployeeController {
  constructor(private readonly masterData: MasterDataService) {}

  static toResponse(row: Employee): EmployeeResponseDto {
    return {
      id: row.id,
      // The employee number is this row's short human identifier, so it fills
      // the shared `code` field as well as its own domain-named one.
      code: row.employeeNumber,
      name: row.name,
      status: row.status,
      factoryId: row.factoryId,
      employeeNumber: row.employeeNumber,
      department: row.department,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @Paginated()
  @ApiOperation({ summary: 'List employees within the caller factory scope' })
  @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: ScopedMasterDataQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const { items, ...page } = await this.masterData.findEmployees(query, user);
    return { items: items.map((item) => EmployeeController.toResponse(item)), ...page };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @ApiOperation({ summary: 'Fetch one employee' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return EmployeeController.toResponse(await this.masterData.findEmployee(id, user));
  }
}
