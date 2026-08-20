import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Opaque single-use token from the reset link.' })
  @IsString()
  @MaxLength(255)
  token!: string;

  @ApiProperty({ example: 'NewPassword1', description: 'Minimum 8 characters, at least 1 digit.' })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Matches(/\d/, { message: 'newPassword must contain at least 1 number' })
  newPassword!: string;
}
