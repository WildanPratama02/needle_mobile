import { ExecutionContext, UseGuards, applyDecorators, createParamDecorator } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

import { DeviceContextGuard } from '../guards/device-context.guard';
import { DeviceContext } from '../interfaces/device-context.interface';
import { RequestWithContext } from '../interfaces/request-context.interface';

/** Marks a tablet-only route: requires a valid `X-Device-ID` (Docs/12 §9). */
export const RequireDeviceContext = () =>
  applyDecorators(
    UseGuards(DeviceContextGuard),
    ApiHeader({
      name: 'X-Device-ID',
      required: true,
      description: 'Id of the registered, ACTIVE device making the call',
    }),
  );

/** Injects the `DeviceContext` resolved by `DeviceContextGuard`. */
export const CurrentDevice = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DeviceContext | undefined =>
    ctx.switchToHttp().getRequest<RequestWithContext>().deviceContext,
);
