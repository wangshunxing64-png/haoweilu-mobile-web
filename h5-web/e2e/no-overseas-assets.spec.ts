import { expect, test } from "@playwright/test";
import { mockApi } from "./fixtures";
test("does not request blocked overseas runtime assets", async ({ page }) => { const urls: string[] = []; page.on("request", (r) => urls.push(r.url())); await mockApi(page); await page.goto("/?storeId=liji-main"); await expect(page.getByText("哪一口让你记住了？")).toBeVisible(); expect(urls.join("\n")).not.toMatch(/fonts\.googleapis|fonts\.gstatic|images\.unsplash|raw\.githubusercontent/); });
