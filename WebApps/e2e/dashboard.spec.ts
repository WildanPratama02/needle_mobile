import { test, expect } from "@playwright/test";
import { mockAuthMe } from "./helpers/auth";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthMe(page);
  });

  test("redirects from / and renders KPIs, trend chart, and stock alerts", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(page.getByText("Total Exchange")).toBeVisible();
    await expect(page.getByText("1245")).toBeVisible();
    await expect(page.getByText("Broken Needle")).toBeVisible();
    await expect(page.getByText("Bent Needle")).toBeVisible();
    await expect(page.getByText("Changeover")).toBeVisible();

    await expect(page.getByText("Pending Confirmation", { exact: false })).toBeVisible();

    await expect(page.getByText("Exchange Trend")).toBeVisible();
    await expect(page.locator(".recharts-area")).toBeVisible();

    await expect(page.getByText("Top Needle Types")).toBeVisible();
    await expect(page.locator("table").getByText("DBx1 Standard")).toBeVisible();

    await expect(page.getByText("Stock Alert")).toBeVisible();
    await expect(page.getByText("Out of Stock")).toBeVisible();
  });

  test("manual refresh re-fetches without erroring", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Total Exchange")).toBeVisible();
    await expect(page.getByText(/Last Updated: \d{2}:\d{2}/)).toBeVisible();

    await page.getByRole("button", { name: "Refresh" }).click();

    // Refetch succeeded (data still renders, no ErrorState took over).
    await expect(page.getByText("1245")).toBeVisible();
    await expect(page.getByText(/Last Updated: \d{2}:\d{2}/)).toBeVisible();
  });

  test("factory filter is scoped to the real factoryIds from the session (no name-resolution endpoint exists, so the label is the raw id)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.getByRole("combobox").first().click();
    await expect(page.getByRole("option", { name: "All Factories" })).toBeVisible();
    await expect(page.getByRole("option", { name: "FAC-001", exact: true })).toBeVisible();
    await expect(page.getByRole("option", { name: "FAC-002", exact: true })).toBeVisible();
  });
});
