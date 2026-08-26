import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceStatus } from '@prisma/client';

export class DeviceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'DEV-001' })
  deviceCode!: string;

  @ApiProperty({ example: 'Trolley A-01 Tablet' })
  deviceName!: string;

  @ApiProperty({ example: 'SN-0001' })
  serialNumber!: string;

  @ApiProperty({ format: 'uuid' })
  factoryId!: string;

  @ApiProperty({ format: 'uuid' })
  trolleyId!: string;

  @ApiProperty({ enum: DeviceStatus })
  status!: DeviceStatus;

  @ApiPropertyOptional({ nullable: true, example: '1.2.0' })
  appVersion!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Set by POST /devices/:id/heartbeat — no WebApps surface calls that route.',
  })
  lastSeenAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
