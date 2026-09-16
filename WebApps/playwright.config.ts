import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  /**
   * Capped deliberately. At the default worker count (one per core) this suite
   * loses ~18 specs to 5s expect timeouts on a developer machine — the app is
   * fine, the box is oversubscribed. Two workers keeps the run honest without
   * raising the timeout, which would only hide a real slow path later.
   */
  workers: 2,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3277",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    /**
     * A production build, not `next dev`. Under `next dev` every route is
     * compiled on first navigation, so whichever spec reaches a route first
     * pays seconds of compilation inside its own 5s expect budget — which is
     * why cross-route assertions (`toHaveURL` after a client-side navigation)
     * were the ones failing under load. Serving a prebuilt app removes that
     * cost at the source instead of widening the timeout to hide it.
     */
    command: "npm run build && npx next start -p 3277",
    url: "http://localhost:3277",
    reuseExistingServer: !process.env.CI,
    /** Covers the build, not a per-test wait — the suite's own timeouts are untouched. */
    timeout: 300_000,
  },
});
