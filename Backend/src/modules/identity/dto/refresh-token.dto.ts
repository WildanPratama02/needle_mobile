import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** Body for both `POST /auth/refresh` and `POST /auth/logout`. */
export class RefreshTokenDto {
  @ApiProperty({ description: 'The opaque refresh token issued at login.' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
