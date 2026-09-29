import { afterEach, describe, expect, it, vi } from "vitest";

import rawNextConfig from "../../../next.config.mjs";

interface SimpleRewrite {
  source: string;
  destination: string;
}

// NextConfig types `rewrites` as optional and as a union of array/object
// forms; this config always defines the flat-array form.
const nextConfig = rawNextConfig as unknown as { rewrites: () => Promise<SimpleRewrite[]> };

const ORIGINAL = { ...process.env };

async function rewritesFor(target: string | undefined): Promise<SimpleRewrite[]> {
  if (target === undefined) delete process.env.API_PROXY_TARGET;
  else process.env.API_PROXY_TARGET = target;
  return nextConfig.rewrites();
}

describe("next.config.mjs API proxy", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL };
    vi.restoreAllMocks();
  });

  it("forwards /api/v1/* to the Backend default port when API_PROXY_TARGET is unset", async () => {
    expect(await rewritesFor(undefined)).toEqual([
      { source: "/api/v1/:path*", destination: "http://localhost:3000/api/v1/:path*" },
    ]);
  });

  it("forwards /api/v1/* to API_PROXY_TARGET", async () => {
    expect(await rewritesFor("http://localhost:3100")).toEqual([
      { source: "/api/v1/:path*", destination: "http://localhost:3100/api/v1/:path*" },
    ]);
  });

  it("tolerates a trailing slash or an /api/v1 suffix copied from the old base-URL setting", async () => {
    expect((await rewritesFor("http://192.168.1.10:3100/"))[0].destination).toBe(
      "http://192.168.1.10:3100/api/v1/:path*"
    );
    expect((await rewritesFor("http://192.168.1.10:3100/api/v1/"))[0].destination).toBe(
      "http://192.168.1.10:3100/api/v1/:path*"
    );
  });

  it("refuses a target that is not an absolute http(s) URL, instead of proxying somewhere surprising", async () => {
    await expect(rewritesFor("192.168.1.10:3100")).rejects.toThrow(/API_PROXY_TARGET/);
  });
});
