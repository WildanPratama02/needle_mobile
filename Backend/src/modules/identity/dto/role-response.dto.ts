import { ApiProperty } from '@nestjs/swagger';

/**
 * `.scratch/roles-permissions/spec.md`. `memberCount` is scoped to the
 * caller's factory intersection, same as every other scoped count in this
 * system — it is not a global count, even though the role/permission
 * catalogue itself is global policy (see `RoleService`).
 */
export class RoleResponseDto {
  @ApiProperty()
  code!: string;

  @ApiProperty({ type: [String] })
  permissionCodes!: string[];

  @ApiProperty({ description: "Users holding this role within the caller's factory scope." })
  memberCount!: number;
}
