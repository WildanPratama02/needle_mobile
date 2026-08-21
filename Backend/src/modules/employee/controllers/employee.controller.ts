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
import { Employee } from '@prisma/client';

import { AUDIT_ACTIONS, Audit } from '../../../common/decorators/audit.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { ScopedMasterDataQueryDto } from '../../master-data/dto/master-data-query.dto';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee-request.dto';
import { EmployeeResponseDto } from '../dto/employee-response.dto';
import { EmployeeService } from '../services/employee.service';

const NOT_FOUND = { status: 404, description: 'No such row' };
const FORBIDDEN = { status: 403, description: 'Missing MASTER_VIEW/MASTER_EDIT, or outside factory scope' };

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

/**
 * Moved here from `master-data` (`.scratch/master-data-storage-rfid/spec.md`
 * decision #15) — same `GET /employees*` routes, plus the write routes that
 * module never had. `employeeNumber` is manual entry (decision #11), never
 * `NumberSequenceService` (that's for daily-resetting transaction refs).
 */
@ApiTags('employee')
@ApiBearerAuth()
@Controller({ path: 'employees', version: '1' })
export class EmployeeController {
  constructor(private readonly employees: EmployeeService) {}

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
    const { items, ...page } = await this.employees.findMany(query, user);
    return { items: items.map((item) => EmployeeController.toResponse(item)), ...page };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MASTER_VIEW)
  @ApiOperation({ summary: 'Fetch one employee' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return EmployeeController.toResponse(await this.employees.findOne(id, user));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'Employee')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an employee',
    description:
      'rfidUid is optional — when present, enrolls the employee\'s first RFID card in the ' +
      'same transaction (spec decision #12). A conflicting rfidUid fails the whole request.',
  })
  @ApiResponse({ status: 201, type: EmployeeResponseDto })
  @ApiResponse({ status: 409, description: 'employeeNumber already in use, or rfidUid already ACTIVE elsewhere' })
  async create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: AuthenticatedUser) {
    return EmployeeController.toResponse(await this.employees.create(dto, user));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MASTER_EDIT)
  @Audit(AUDIT_ACTIONS.CHANGE_MASTER, 'Employee')
  @ApiOperation({
    summary: 'Edit an employee',
    description:
      'name/department/status only — employeeNumber and factory are not editable here. ' +
      'Setting status to INACTIVE auto-revokes the active RFID card, if any (spec decision #13).',
  })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async update(
    @Param('id', uuid()) id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return EmployeeController.toResponse(await this.employees.update(id, dto, user));
  }
}
