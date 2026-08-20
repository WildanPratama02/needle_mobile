import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@needle.local' })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
