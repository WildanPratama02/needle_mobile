import { ApiProperty } from '@nestjs/swagger';

/** Documentation-only shapes — they mirror what the services already return. */

export class LoginUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'admin' })
  username!: string;

  @ApiProperty({ example: 'System Admin' })
  name!: string;

  @ApiProperty({ example: ['SYSTEM_ADMIN'], type: [String] })
  roles!: string[];
}

export class TokenPairDto {
  @ApiProperty({ description: 'Signed JWT for the Authorization header.' })
  accessToken!: string;

  @ApiProperty({ description: 'Opaque single-use token; rotates on refresh.' })
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Access-token lifetime in seconds.' })
  expiresIn!: number;
}

export class LoginResponseDto extends TokenPairDto {
  @ApiProperty({ type: LoginUserDto })
  user!: LoginUserDto;
}

export class MeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'admin' })
  username!: string;

  @ApiProperty({ example: 'System Admin' })
  name!: string;

  @ApiProperty({ example: ['SYSTEM_ADMIN'], type: [String] })
  roles!: string[];

  @ApiProperty({ example: ['EXCHANGE_CREATE'], type: [String] })
  permissions!: string[];

  @ApiProperty({ type: [String], format: 'uuid' })
  factoryIds!: string[];

  @ApiProperty({ type: [String], format: 'uuid' })
  locationIds!: string[];
}
