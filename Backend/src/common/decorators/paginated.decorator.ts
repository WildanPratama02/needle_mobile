import { SetMetadata } from '@nestjs/common';

export const PAGINATED_KEY = 'paginatedResponse';

/**
 * Marks a route whose handler returns `{ items, total, page, pageSize }`.
 *
 * `ResponseFormatInterceptor` lifts `items` into `data` and the counters into
 * `meta`, per the pagination envelope in `Docs/12` §7.
 *
 * Explicit rather than shape-sniffing: a route is paginated because it says so,
 * not because its payload happens to have four matching field names.
 */
export const Paginated = () => SetMetadata(PAGINATED_KEY, true);
