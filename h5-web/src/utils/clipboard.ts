export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) { try { await navigator.clipboard.writeText(text); return; } catch { /* fallback */ } }
  const area = document.createElement("textarea"); area.value = text; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0"; document.body.append(area); area.select();
  const copied = document.execCommand?.("copy") ?? false; area.remove(); if (!copied) throw new Error("复制失败，请长按评价文字手动复制");
}
