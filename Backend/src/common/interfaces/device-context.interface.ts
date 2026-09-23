import { Device, Factory, Trolley } from '@prisma/client';

/**
 * The tablet a request comes from, validated by `DeviceContextGuard`.
 *
 * Factory and trolley come from the device's binding, never from the request
 * body (Docs/07 §4): a tablet works for the trolley it is bound to.
 */
export interface DeviceContext {
  device: Device;
  factory: Factory;
  trolley: Trolley;
}
