import { expect, test } from "@playwright/test";
import { mockApi } from "./fixtures";
test("never overflows the mobile viewport", async ({ page }) => { await mockApi(page); await page.goto("/?storeId=liji-main"); await expect(page.getByRole("main", { name: "好味录" })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); });

test("keeps the AI Studio hero at its intended mobile size", async ({ page }) => {
  await mockApi(page);
  await page.goto("/?storeId=liji-main");

  const hero = page.getByRole("img", { name: "好味录吉祥物头像" });
  await expect(hero).toBeVisible();
  await expect(hero).toHaveCSS("width", "132px");
  await expect(hero).toHaveCSS("height", "147px");
  await expect(page.getByRole("button", { name: "立即生成真实评价" })).toBeInViewport();
});

test("allows all six dishes and shows the revised Li Ji copy", async ({ page }) => {
  await mockApi(page);
  await page.goto("/?storeId=liji-main");
  await page.getByRole("button", { name: "立即生成真实评价" }).click();

  await expect(page.getByText("李记", { exact: true })).toBeVisible();
  await expect(page.getByText("最多选择 6 道，方便为您定制心里的真实评价。", { exact: true })).toBeVisible();

  for (const dish of ["骨汤烫菜", "酸菜蹄膀", "辣子鸡火锅", "豆米火锅", "麻辣烫", "肥肠鸡火锅"]) {
    await page.getByRole("button", { name: new RegExp(dish) }).click();
  }

  await expect(page.getByText("6", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("/ 6 道菜", { exact: true })).toBeVisible();
  await expect(page.getByText("已选好 6 道", { exact: true })).toBeVisible();
});
