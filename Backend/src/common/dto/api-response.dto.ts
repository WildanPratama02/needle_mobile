import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * The response envelope from `Docs/12` §7. Every endpoint returns this shape;
 * controllers return their payload and `ResponseFormatInterceptor` wraps it.
 */
export class ResponseMetaDto {
  @ApiProperty({ format: 'uuid', description: 'Echoes X-Request-ID when supplied.' })
  requestId!: string;

  @ApiPropertyOptional({ description: 'Present on paginated responses only.' })
  page?: number;

  @ApiPropertyOptional()
  pageSize?: number;

  @ApiPropertyOptional()
  total?: number;

  @ApiPropertyOptional()
  totalPages?: number;
}

export class ApiSuccessDto<T = unknown> {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty()
  data!: T;

  @ApiProperty({ type: ResponseMetaDto })
  meta!: ResponseMetaDto;
}

export class ApiErrorBodyDto {
  @ApiProperty({ example: 'NOT_FOUND', description: 'Stable machine-readable code.' })
  code!: string;

  @ApiProperty({ example: 'Exchange transaction was not found.' })
  message!: string;

  @ApiProperty({
    type: [String],
    description: 'Field-level validation messages; empty for non-validation errors.',
  })
  details!: string[];
}

export class ApiErrorDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ type: ApiErrorBodyDto })
  error!: ApiErrorBodyDto;

  @ApiProperty({ type: ResponseMetaDto })
  meta!: ResponseMetaDto;
}

/**
 * What a controller returns for a paginated route. `ResponseFormatInterceptor`
 * lifts `items` into `data` and the counters into `meta`.
 */
export interface PaginatedPayload<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
