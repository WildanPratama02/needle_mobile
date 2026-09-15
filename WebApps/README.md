# Needle Mobile — WebApps

Next.js management app for the Needle Mobile System. Specs live in `../Docs/` (`08-SRS-WebApps.md`, `18-WebApps-UI-UX-Specification.md`, `design.md`); the API it talks to is `../Backend/`.

## Getting Started

```bash
cp .env.example .env.local   # then set API_PROXY_TARGET
npm ci
npm run dev                  # http://localhost:3200
```

## Reaching the Backend

The browser never calls the Backend directly. Every request goes to `/api/v1/...` on **this app's own origin**, and `next.config.mjs` rewrites it to the Backend:

```text
browser ──► http://<wherever you opened the app>/api/v1/auth/login
            └── Next.js rewrite ──► ${API_PROXY_TARGET}/api/v1/auth/login
```

- `API_PROXY_TARGET` is the Backend **origin only** (e.g. `http://localhost:3000`, no `/api/v1`). Default `http://localhost:3000`, the Backend's default `PORT`.
- It is server-only (no `NEXT_PUBLIC_` prefix) and never reaches the browser.
- Because the call is same-origin, there is no CORS preflight, and login does not depend on the Backend's `CORS_ORIGINS` or on which host/LAN IP the app was opened from.
- `next dev` reads it at startup. A production `next build` bakes the rewrite into the build output, so set it when building, not only when running `next start`.
- `NEXT_PUBLIC_API_BASE_URL` is no longer used. Remove it from any existing `.env` (the dev server warns if it is still set).

`Authorization`, `Idempotency-Key`, `X-Device-ID` and `X-Request-ID` pass through the rewrite unchanged, for every HTTP method.

If the Backend is down or `API_PROXY_TARGET` is wrong, screens show "Cannot reach the server. Please check your connection and try again." instead of a generic error (`getApiErrorMessage` in `src/core/api/client.ts`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3200 |
| `npm run build` / `npm start` | Production build / server on port 3200 |
| `npm run lint` | ESLint (`next lint`) |
| `npm test` | Vitest unit/component tests |
| `npm run test:e2e` | Playwright (starts its own dev server on port 3277; API calls are mocked) |
