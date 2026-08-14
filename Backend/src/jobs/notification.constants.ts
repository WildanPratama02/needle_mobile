/**
 * Queue identifiers live here rather than beside the processor.
 *
 * `NotificationService` enqueues and the processor consumes, so if the names
 * lived on the processor the two files would import each other and the service
 * would be undefined at injection time.
 */
export const NOTIFICATION_QUEUE = 'notification-dispatch';
export const NOTIFICATION_DISPATCH_JOB = 'send';
