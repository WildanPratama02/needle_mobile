import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/**
 * `.scratch/device-and-inventory/spec.md` (GAP-13 Phase 1). `factoryId` and
 * `trolleyId` narrow the caller's own scope, never widen it — same
 * intersect-not-widen rule every other scoped list in this app follows.
 * Location scope (Device story 16) is not a query param: it is resolved
 * automatically from the caller's own `AuthenticatedUser.locationIds`, the
 * same way factory scope needs no explicit opt-in.
 */
export class DeviceQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  trolleyId?: string;

  @ApiPropertyOptional({ enum: DeviceStatus })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, description: 'Capped at 100.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
