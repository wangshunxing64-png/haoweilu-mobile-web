export class ApiError extends Error { constructor(message: string, public readonly status: number, public readonly code = "API_ERROR") { super(message); } }
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  let response: Response;
  try { response = await fetch(`${base}${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }); }
  catch { throw new ApiError("网络连接失败，请检查网络后重试", 0, "NETWORK_ERROR"); }
  const raw = await response.text();
  let body: unknown = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
  if (!response.ok) {
    const error = (body as { error?: { message?: string; code?: string }; message?: string });
    throw new ApiError(error.error?.message ?? error.message ?? `请求失败（${response.status}）`, response.status, error.error?.code);
  }
  return body as T;
}
export function post<T>(path: string, body: unknown, key?: string) { return apiRequest<T>(path, { method: "POST", body: JSON.stringify(body), headers: key ? { "idempotency-key": key } : {} }); }
export function patch<T>(path: string, body: unknown) { return apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) }); }
