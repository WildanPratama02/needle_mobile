import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/core/api/client";
import { fetchMasterData } from "./data-source";

/** One page, one row — enough to assert what went out on the wire. */
function onePage() {
  return {
    data: {
      success: true,
      data: [],
      meta: { page: 1, pageSize: 100, total: 0, totalPages: 1 },
    },
  };
}

function paramsOfLastCall(spy: ReturnType<typeof vi.spyOn>) {
  const [, config] = spy.mock.calls[spy.mock.calls.length - 1] as [string, { params: Record<string, unknown> }];
  return config.params;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchMasterData", () => {
  it("sends locationType to /locations when the caller asks for one kind of location", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(onePage());

    await fetchMasterData("locations", { factoryId: "FAC-001", locationType: "WAREHOUSE" });

    expect(get.mock.calls[0][0]).toBe("/locations");
    expect(paramsOfLastCall(get)).toMatchObject({
      factoryId: "FAC-001",
      locationType: "WAREHOUSE",
    });
  });

  it("omits locationType when the caller wants every location", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(onePage());

    await fetchMasterData("locations", { factoryId: "FAC-001" });

    expect(paramsOfLastCall(get).locationType).toBeUndefined();
  });

  it("never sends locationType to a collection that rejects it", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(onePage());

    // `/trolleys` and `/employees` answer a `locationType` with a 400, so the
    // parameter must not be reachable from them — the type forbids passing it,
    // and nothing here adds it back.
    await fetchMasterData("trolleys", { factoryId: "FAC-001" });
    expect(paramsOfLastCall(get).locationType).toBeUndefined();

    await fetchMasterData("employees", { factoryId: "FAC-001" });
    expect(paramsOfLastCall(get).locationType).toBeUndefined();
  });

  it("carries the filter onto every page it walks, not just the first", async () => {
    const get = vi.spyOn(apiClient, "get").mockImplementation(() =>
      Promise.resolve({
        data: {
          success: true,
          data: [],
          meta: { page: 1, pageSize: 100, total: 150, totalPages: 2 },
        },
      }),
    );

    await fetchMasterData("locations", { locationType: "USED_NEEDLE_STORAGE" });

    expect(get).toHaveBeenCalledTimes(2);
    for (const call of get.mock.calls) {
      expect((call[1] as { params: Record<string, unknown> }).params.locationType).toBe(
        "USED_NEEDLE_STORAGE",
      );
    }
  });
});
