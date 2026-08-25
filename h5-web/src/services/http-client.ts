export class ApiError extends Error { constructor(message: string, public readonly status: number, public readonly code = "API_ERROR") { super(message); } }

const PRODUCTION_API_BASE_URL = "https://haoweilu-api.onrender.com";

export function resolveApiBaseUrl(rawValue: string | undefined, isProduction: boolean): string {
  const candidate = (rawValue || "").trim().replace(/\/$/, "");
  if (!candidate) return isProduction ? PRODUCTION_API_BASE_URL : "";

  try {
    const url = new URL(candidate);
    const isOriginOnly = url.protocol.startsWith("http") && (url.pathname === "" || url.pathname === "/");
    if (isOriginOnly && !url.search && !url.hash) return url.origin;
  } catch {
    // Invalid dashboard values must not become request URLs.
  }

  return isProduction ? PRODUCTION_API_BASE_URL : "";
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, import.meta.env.PROD);
  let response: Response;
  try { response = await fetch(`${base}${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }); }
  catch { throw new ApiError("网络连接失败，请检查网络后重试", 0, "NETWORK_ERROR"); }
  const raw = await response.text();
  let body: unknown = {};
  let parsed = !raw;
  try { body = raw ? JSON.parse(raw) : {}; parsed = true; } catch { body = {}; }
  if (!response.ok) {
    const error = (body as { error?: { message?: string; code?: string }; message?: string });
    throw new ApiError(error.error?.message ?? error.message ?? `请求失败（${response.status}）`, response.status, error.error?.code);
  }
  if (!parsed) {
    throw new ApiError("后端 API 尚未连接，请配置 VITE_API_BASE_URL 后重新部署", 502, "INVALID_API_RESPONSE");
  }
  return body as T;
}
export function post<T>(path: string, body: unknown, key?: string) { return apiRequest<T>(path, { method: "POST", body: JSON.stringify(body), headers: key ? { "idempotency-key": key } : {} }); }
export function patch<T>(path: string, body: unknown) { return apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) }); }
