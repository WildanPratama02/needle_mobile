import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/core/api/client";
import { fetchMasterData } from "./data-source";
import type { MasterDataCollection } from "./types";

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

  /**
   * `GET /suppliers` takes `page` and `pageSize` and nothing else: `?status=`
   * and `?factoryId=` are both a 400 (`SupplierQueryDto`, `Docs/12` §9
   * "Supplier"). A supplier has no lifecycle and no factory
   * (`.scratch/receiving-supplier/spec.md` decisions 2 and 6), so the seam
   * drops both rather than letting one reach the wire.
   */
  it("sends paging and nothing else to /suppliers", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(onePage());

    await fetchMasterData("suppliers");

    expect(get.mock.calls[0][0]).toBe("/suppliers");
    const params = paramsOfLastCall(get);
    expect(params.status).toBeUndefined();
    expect(params.factoryId).toBeUndefined();
    expect(params.locationType).toBeUndefined();
    expect(params.page).toBe(1);
    expect(params.pageSize).toBe(100);
  });

  it("drops a filter forced onto /suppliers through a widened collection type", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(onePage());

    // The type forbids this at every real call site — `MasterDataQuery<"suppliers">`
    // types `status`/`factoryId` as `never`. A caller holding a widened
    // `MasterDataCollection` has no literal left to check against, so the seam
    // is what actually keeps the 400 from happening.
    const collection = "suppliers" as MasterDataCollection;
    await fetchMasterData(collection, { status: "ACTIVE", factoryId: "FAC-001" } as never);

    const params = paramsOfLastCall(get);
    expect(params.status).toBeUndefined();
    expect(params.factoryId).toBeUndefined();
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
