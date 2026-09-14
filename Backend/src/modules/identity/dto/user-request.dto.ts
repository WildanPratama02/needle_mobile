import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * `/users` writes (`.scratch/admin-panel-crud/issues/06`).
 *
 * The admin sets the account's first password (the user's decision on the
 * ticket's open question); the account holder can change it later through
 * the self-service reset flow (ADR-0002). Same password rule as
 * `ResetPasswordDto`.
 *
 * `factoryIds` is required: a user with no factory scope is outside every
 * admin's scope, so nobody could ever edit, grant or even list them again.
 */
export class CreateUserDto {
  @ApiProperty({ example: 'budi.santoso' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  username!: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'Password1', description: 'Minimum 8 characters, at least 1 digit.' })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Matches(/\d/, { message: 'password must contain at least 1 number' })
  password!: string;

  @ApiProperty({
    format: 'uuid',
    isArray: true,
    description: 'At least one; each must be inside the caller factory scope.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  factoryIds!: string[];
}

/** `username` is deliberately absent — set once at create. */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class AssignRoleDto {
  @ApiProperty({ example: 'PIC_TROLI' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  roleCode!: string;
}

export class AssignFactoryScopeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  factoryId!: string;
}
