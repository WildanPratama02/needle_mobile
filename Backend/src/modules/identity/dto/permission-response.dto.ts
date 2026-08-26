import { ApiProperty } from '@nestjs/swagger';

/** `.scratch/roles-permissions/spec.md`. Codes only — no description field exists in `PERMISSIONS` today. */
export class PermissionResponseDto {
  @ApiProperty()
  code!: string;
}
