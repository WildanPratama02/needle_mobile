import { test, expect } from "@playwright/test";
import { mockAuthMe } from "./helpers/auth";

test("root page renders the app shell", async ({ page }) => {
  await mockAuthMe(page);

  await page.goto("/");
  await expect(page.getByText("Needle Management")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
