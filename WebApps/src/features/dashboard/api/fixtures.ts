import { subDays, format } from "date-fns";

import type {
  DashboardOverview,
  ExchangeTrendPoint,
  NeedleConsumptionItem,
  StockSummary,
} from "./types";

export const FIXTURE_OVERVIEW: DashboardOverview = {
  totalExchanges: 1245,
  brokenNeedles: 530,
  bentNeedles: 312,
  changeovers: 403,
  pendingConfirmations: 8,
  lowStockItems: 12,
};

export const FIXTURE_EXCHANGE_TREND: ExchangeTrendPoint[] = Array.from({ length: 14 }, (_, i) => {
  const day = subDays(new Date(), 13 - i);
  const broken = 20 + Math.round(Math.sin(i / 2) * 8 + i * 0.6);
  const bent = 12 + Math.round(Math.cos(i / 3) * 5 + i * 0.3);
  const changeover = 15 + Math.round(Math.sin(i / 4) * 6);
  return {
    date: format(day, "yyyy-MM-dd"),
    total: broken + bent + changeover,
    broken,
    bent,
    changeover,
  };
});

export const FIXTURE_NEEDLE_CONSUMPTION: NeedleConsumptionItem[] = [
  { needleTypeId: "NDL-001", needleTypeCode: "DBX1", needleTypeName: "DBx1 Standard", consumption: 412 },
  { needleTypeId: "NDL-002", needleTypeCode: "DBX1-K", needleTypeName: "DBx1 Knit", consumption: 287 },
  { needleTypeId: "NDL-003", needleTypeCode: "UY128", needleTypeName: "UY128 Overlock", consumption: 201 },
  { needleTypeId: "NDL-004", needleTypeCode: "DPX5", needleTypeName: "DPx5 Heavy", consumption: 156 },
  { needleTypeId: "NDL-005", needleTypeCode: "TVX7", needleTypeName: "TVx7 Cover Stitch", consumption: 98 },
];

export const FIXTURE_STOCK_SUMMARY: StockSummary = {
  totalStock: 4820,
  lowStockCount: 2,
  outOfStockCount: 1,
  lowStockItems: [
    {
      id: "STK-101",
      needleTypeCode: "DBX1",
      needleTypeName: "DBx1 Standard",
      factoryName: "Factory A",
      locationName: "Trolley 02",
      balance: 8,
      minimumStock: 20,
      status: "LOW",
    },
    {
      id: "STK-102",
      needleTypeCode: "UY128",
      needleTypeName: "UY128 Overlock",
      factoryName: "Factory A",
      locationName: "Trolley 01",
      balance: 5,
      minimumStock: 15,
      status: "LOW",
    },
  ],
  outOfStockItems: [
    {
      id: "STK-103",
      needleTypeCode: "DBX1",
      needleTypeName: "DBx1 Standard",
      factoryName: "Factory A",
      locationName: "Trolley 03",
      balance: 0,
      minimumStock: 20,
      status: "OUT_OF_STOCK",
    },
  ],
};
