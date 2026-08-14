/**
 * Queue identifiers, kept apart from the processor so the service that
 * schedules the sweep and the processor that runs it do not import each other.
 */
export const RETENTION_QUEUE = 'record-retention';
export const RETENTION_SWEEP_JOB = 'sweep';
