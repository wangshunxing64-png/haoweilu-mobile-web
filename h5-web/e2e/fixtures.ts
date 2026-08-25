import type { Page } from "@playwright/test";
export async function mockApi(page: Page) {
  await page.route("**/api/**", async (route) => { const url = route.request().url(); let body: unknown = {};
    if (url.includes("/api/config")) body = { merchant: { id: "liji", name: "李记好味道" }, store: { id: "liji-main", name: "李记好味道·总店" }, dishes: [{ id: "bone-soup", name: "骨汤烫菜", description: "鲜香暖胃" }, { id: "pickled-pork", name: "酸菜蹄膀", description: "软糯开胃" }, { id: "spicy-chicken-hotpot", name: "辣子鸡火锅", description: "香辣过瘾" }, { id: "bean-hotpot", name: "豆米火锅", description: "浓郁绵密" }, { id: "mala-tang", name: "麻辣烫", description: "贵阳风味" }, { id: "intestine-chicken-hotpot", name: "肥肠鸡火锅", description: "软糯鲜香" }], tags: [{ id: "broth", name: "汤底鲜香" }, { id: "service", name: "服务热情" }], platforms: [{ id: "meituan", name: "美团" }, { id: "dianping", name: "大众点评" }], rewards: [] };
    else if (url.endsWith("/api/sessions")) body = { id: "session-1", merchantId: "liji", storeId: "liji-main", dishIds: [], tagIds: [], message: "", status: "CREATED", expiresAt: new Date(Date.now() + 3600000).toISOString() };
    else if (url.includes("/api/reviews/generate")) body = { sessionId: "session-1", reviews: [1,2,3].map((i) => ({ id: `review-${i}`, sessionId: "session-1", styleId: `s${i}`, styleName: `风格${i}`, styleLabel: ["自然真实","简洁有力","细节丰富"][i-1], content: `骨汤烫菜汤底鲜香，服务也很热情。这是第${i}种真实表达。`, selected: false, provider: "local-template" })) };
    else body = { id: "ok" };
    await route.fulfill({ status: url.includes("/api/events") ? 201 : 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}
