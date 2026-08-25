import type { EntryParams } from "../types/app";
const SAFE = /^[a-zA-Z0-9._:-]{1,128}$/;
export function parseEntryParams(search: string): EntryParams {
  const params = new URLSearchParams(search);
  const read = (key: string) => { const value = params.get(key)?.trim(); return value && SAFE.test(value) ? value : undefined; };
  return { storeId: read("storeId"), merchantId: read("merchantId"), scene: read("scene") };
}
