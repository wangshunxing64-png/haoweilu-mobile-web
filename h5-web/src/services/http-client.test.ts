import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./http-client";

describe("apiRequest", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("returns JSON responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    await expect(apiRequest("/health")).resolves.toEqual({ ok: true });
  });
  it("surfaces backend business messages", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "会话已过期" } }), { status: 410 })));
    await expect(apiRequest("/api/sessions/expired")).rejects.toThrow("会话已过期");
  });
  it("rejects a successful HTML SPA fallback as an invalid API response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<!doctype html><title>好味录</title>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    })));
    await expect(apiRequest("/api/config")).rejects.toThrow("后端 API 尚未连接");
  });
});
