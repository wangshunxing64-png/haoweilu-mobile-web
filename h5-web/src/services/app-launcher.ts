import { copyText } from "../utils/clipboard";
export function platformScheme(platform: string) { return platform === "meituan" ? "imeituan://" : platform === "dianping" ? "dianping://" : ""; }
export async function launchPlatform(input: { platform: string; scheme?: string; copyText: string; storeName: string }): Promise<{ opened: boolean; hint: string }> {
  await copyText(input.copyText); const scheme = input.scheme || platformScheme(input.platform); if (!scheme) return { opened: false, hint: "该平台暂不支持自动打开" };
  window.location.href = scheme; await new Promise((resolve) => window.setTimeout(resolve, 1400));
  const opened = document.visibilityState === "hidden";
  return { opened, hint: opened ? "评价已复制" : `未检测到应用，请手动打开平台并搜索“${input.storeName}”` };
}
