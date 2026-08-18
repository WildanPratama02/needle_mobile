import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../decorators/public.decorator';
import { HealthService, HealthStatus } from './health.service';

/**
 * The two operational probes (`Docs/12` §29).
 *
 * **Deliberately unversioned**, and excluded from the API prefix in
 * `bootstrap.ts`. Every other route in this service sits under `/api/v1`; an
 * orchestrator's probe URL must not move when the API version bumps, because
 * that breaks the deployment rather than the API. This is the one exception to
 * the routing rule, and a second one should be treated as a smell.
 *
 * Both are `@Public()`: a probe should not need a service account.
 */
@ApiTags('health')
@Controller({ version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness — is the process answering?' })
  @ApiResponse({ status: 200, description: 'The process is up' })
  liveness(): HealthStatus {
    return this.health.liveness();
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness — can the process serve requests?' })
  @ApiResponse({ status: 200, description: 'Dependencies are reachable' })
  @ApiResponse({ status: 503, description: 'A dependency is unreachable' })
  readiness(): Promise<HealthStatus> {
    return this.health.readiness();
  }
}
