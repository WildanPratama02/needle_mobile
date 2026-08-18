import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

/**
 * Deliberately excludes every credential-bearing field — no `passwordHash`,
 * `refreshTokens`, `lastLoginAt`, `email` or `phoneNumber`. This is a
 * read-only directory endpoint (`.scratch/users-read-api/spec.md`), not a
 * session or account-management response; nothing here is sensitive.
 */
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'budi.santoso' })
  username!: string;

  @ApiProperty({ example: 'Budi Santoso' })
  name!: string;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ example: ['SYSTEM_ADMIN'], type: [String], description: 'Role codes.' })
  roles!: string[];

  @ApiProperty({ type: [String], format: 'uuid' })
  factoryIds!: string[];
}
