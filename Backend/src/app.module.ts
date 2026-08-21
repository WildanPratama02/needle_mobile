import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HealthModule } from './common/health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RbacGuard } from './common/guards/rbac.guard';
import { ScopeGuard } from './common/guards/scope.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { ResponseFormatInterceptor } from './common/interceptors/response-format.interceptor';
import { IdempotencyKeyMiddleware } from './common/middleware/idempotency-key.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { PrismaModule } from './database/prisma.module';
import { RetentionModule } from './jobs/retention.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { AuditModule } from './modules/audit/audit.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { IdentityModule } from './modules/identity/identity.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { NotificationModule } from './modules/notification/notification.module';
import { RfidModule } from './modules/rfid/rfid.module';

/**
 * Root module. Remaining domain modules (device, reporting, synchronization)
 * get registered here as their tickets land. `RfidModule` is imported before
 * `EmployeeModule` since the latter depends on it
 * (`.scratch/master-data-storage-rfid/spec.md`).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    // Redis-backed queues: confirmation expiry and WhatsApp dispatch today,
    // report export later (Backend/CLAUDE.md §6).
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password') || undefined,
        },
      }),
    }),
    PrismaModule,
    HealthModule,
    IdentityModule,
    MasterDataModule,
    ExchangeModule,
    InventoryModule,
    ApprovalModule,
    AuditModule,
    NotificationModule,
    RetentionModule,
    RfidModule,
    EmployeeModule,
  ],
  providers: [
    // Authenticate, then check the permission, then the factory/location
    // scope. Global, so a new endpoint is protected by default and must opt
    // out with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    { provide: APP_GUARD, useClass: ScopeGuard },

    // Interceptor order matters and is the reverse of registration on the way
    // out: the *last* registered sees the handler's result first. Audit must
    // read the raw payload, so it is registered after the formatter — which
    // therefore wraps only once audit has taken its snapshot.
    { provide: APP_INTERCEPTOR, useClass: ResponseFormatInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },

    // Catches everything, so no failure escapes in a shape the contract does
    // not describe (Docs/12 §7).
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Request id first: the idempotency replay path returns early and still
    // has to stamp the current request's id onto the stored envelope.
    consumer.apply(RequestIdMiddleware).forRoutes('*path');

    // Idempotency applies to writes only. GETs are naturally repeatable, and
    // storing a response for one would just burn rows (Backend/CLAUDE.md §5).
    consumer
      .apply(IdempotencyKeyMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.POST });
  }
}
