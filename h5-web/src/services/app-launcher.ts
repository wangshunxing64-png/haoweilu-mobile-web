import { copyText } from "../utils/clipboard";
const MEITUAN_STORE_SHARE_URL = "https://dpurl.cn/swRRFoqz";
export function platformScheme(platform: string) { return platform === "meituan" ? "imeituan://" : platform === "dianping" ? "dianping://" : ""; }
export function platformLaunchTarget(platform: string, preparedTarget?: string) {
  return platform === "meituan" ? MEITUAN_STORE_SHARE_URL : preparedTarget || platformScheme(platform);
}
export async function launchPlatform(input: { platform: string; scheme?: string; copyText: string; storeName: string }): Promise<{ opened: boolean; hint: string }> {
  await copyText(input.copyText); const target = platformLaunchTarget(input.platform, input.scheme); if (!target) return { opened: false, hint: "该平台暂不支持自动打开" };
  window.location.href = target; await new Promise((resolve) => window.setTimeout(resolve, 1400));
  const opened = document.visibilityState === "hidden";
  return { opened, hint: opened ? "评价已复制" : `未检测到应用，请手动打开平台并搜索“${input.storeName}”` };
}
