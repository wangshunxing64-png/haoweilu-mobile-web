import { expect, test } from "@playwright/test";
import { mockApi } from "./fixtures";

test("reaches the exact AI Studio platform screen with API data", async ({ page }) => {
  await mockApi(page);
  await page.goto("/?storeId=liji-main&merchantId=liji&scene=e2e");
  await expect(page.getByText("哪一口让你记住了？")).toBeVisible();
  await page.getByRole("button", { name: "立即生成真实评价" }).click();
  await page.getByRole("button", { name: /骨汤烫菜/ }).click();
  await page.getByRole("button", { name: /下一步：记录用餐感受/ }).click();
  await page.getByRole("button", { name: /汤底鲜香/ }).click();
  await page.getByRole("button", { name: /下一步：开始聆听构思/ }).click();
  await expect(page.getByRole("heading", { name: "还有什么想特别说的？" })).toBeVisible();
  await page.getByRole("textbox", { name: "补充真实感受" }).fill("汤很鲜，店员服务也很热情");
  await page.getByRole("button", { name: "生成我的评价" }).click();
  await expect(page.getByText("已为您定制 3 种专属评价")).toBeVisible();
  await page.getByRole("button", { name: "选择此段评价并发布" }).first().click();
  await expect(page.getByText("选择发布渠道")).toBeVisible();
});

async function reachPlatform(page: import('@playwright/test').Page) {
  await page.goto("/?storeId=liji-main&merchantId=liji&scene=e2e");
  await page.getByRole("button", { name: "立即生成真实评价" }).click();
  await page.getByRole("button", { name: /骨汤烫菜/ }).click();
  await page.getByRole("button", { name: /下一步：记录用餐感受/ }).click();
  await page.getByRole("button", { name: /汤底鲜香/ }).click();
  await page.getByRole("button", { name: /下一步：开始聆听构思/ }).click();
  await page.getByRole("button", { name: "生成我的评价" }).click();
  await expect(page.getByText("已为您定制 3 种专属评价")).toBeVisible();
  await page.getByRole("button", { name: "选择此段评价并发布" }).first().click();
}

test("shows app fallback and does not claim an unselected reward", async ({ page }) => {
  let rewardRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/rewards/claim')) rewardRequests += 1;
  });
  await mockApi(page);
  await reachPlatform(page);
  await page.getByRole('button', { name: /发布到美团/ }).click();
  await expect(page.getByRole('alert')).toContainText('请手动打开平台');
  await page.getByRole('button', { name: '我已手动打开，继续' }).click();
  await page.getByRole('button', { name: '完成真实反馈' }).click();
  await expect(page.getByText('真实反馈已完成，感谢您的分享！')).toBeVisible();
  expect(rewardRequests).toBe(0);
});

test("restores safe session progress after reload", async ({ page }) => {
  await mockApi(page);
  await page.goto("/?storeId=liji-main&merchantId=liji&scene=e2e");
  await page.getByRole("button", { name: "立即生成真实评价" }).click();
  await page.getByRole("button", { name: /骨汤烫菜/ }).click();
  await page.getByRole("button", { name: /下一步：记录用餐感受/ }).click();
  await page.reload();
  await expect(page.getByText('哪些地方让你印象深刻？')).toBeVisible();
  await page.getByRole('button', { name: '返回上一页' }).click();
  await expect(page.getByText('已选好 1 道')).toBeVisible();
});
