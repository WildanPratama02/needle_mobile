const DEFAULT_API_PROXY_TARGET = "http://localhost:3000";

/**
 * Where `/api/v1/*` is forwarded — the Backend's origin, without the path.
 *
 * The browser always calls the API on the WebApp's own origin
 * (`src/core/api/client.ts`), and this server forwards it. Same-origin means
 * no CORS preflight and no dependence on the Backend's `CORS_ORIGINS` or on
 * whichever host/LAN IP the app was opened from.
 *
 * Server-only on purpose (no `NEXT_PUBLIC_`): it never reaches the browser.
 * `next dev` reads it at startup; a production build bakes the rewrite into
 * `.next/routes-manifest.json`, so set it at `next build` time, not only at
 * `next start`.
 */
function resolveApiProxyTarget() {
  const raw = (process.env.API_PROXY_TARGET ?? "").trim() || DEFAULT_API_PROXY_TARGET;

  let url;
  try {
    url = new URL(raw);
  } catch {
    url = null;
  }
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) {
    throw new Error(
      `API_PROXY_TARGET must be an absolute http(s) URL such as http://localhost:3000 — got "${raw}".`
    );
  }

  // Tolerate a value copied from the old NEXT_PUBLIC_API_BASE_URL
  // (".../api/v1") or with a trailing slash; the path is appended below.
  return raw.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
}

if (process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn(
    "[next.config] NEXT_PUBLIC_API_BASE_URL is no longer read — the WebApp proxies /api/v1 through its own origin. " +
      "Remove it and set API_PROXY_TARGET to the Backend origin (e.g. http://localhost:3000)."
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const target = resolveApiProxyTarget();
    return [{ source: "/api/v1/:path*", destination: `${target}/api/v1/:path*` }];
  },
};

export default nextConfig;
