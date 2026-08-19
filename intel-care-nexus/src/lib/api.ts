export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8001/api/v1";

const ACCESS_TOKEN_KEY = "medintel_access_token";
const REFRESH_TOKEN_KEY = "medintel_refresh_token";

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

function getStorage() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage;
}

function getSessionStorage() {
  if (!isBrowser()) {
    return null;
  }

  return window.sessionStorage;
}

function readToken(key: string) {
  const local = getStorage();
  const session = getSessionStorage();
  return local?.getItem(key) ?? session?.getItem(key) ?? null;
}

function writeToken(key: string, value: string, persist: boolean) {
  const storage = persist ? getStorage() : getSessionStorage();
  storage?.setItem(key, value);
}

function removeToken(key: string) {
  getStorage()?.removeItem(key);
  getSessionStorage()?.removeItem(key);
}

export function getAccessToken() {
  return readToken(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return readToken(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(tokens: AuthTokens, persist = true) {
  writeToken(ACCESS_TOKEN_KEY, tokens.access_token, persist);
  writeToken(REFRESH_TOKEN_KEY, tokens.refresh_token, persist);
}

export function clearAuthTokens() {
  removeToken(ACCESS_TOKEN_KEY);
  removeToken(REFRESH_TOKEN_KEY);
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const token = getAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const hasBody =
    options.body !== undefined && options.body !== null && options.body !== "";

  if (hasBody && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      "Backend unavailable. Please check the server and try again.",
      503,
      error,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthTokens();
      if (isBrowser()) {
        const pathname = window.location.pathname;
        if (!pathname.startsWith("/login") && !pathname.startsWith("/register")) {
          window.location.href = "/login";
        }
      }
    }

    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? (payload as { detail?: unknown }).detail
        : payload;
    const message = (() => {
      if (typeof detail === "string") {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail
          .map((item) => {
            if (item && typeof item === "object") {
              const typed = item as { msg?: unknown; message?: unknown; loc?: unknown };
              if (typeof typed.msg === "string") return typed.msg;
              if (typeof typed.message === "string") return typed.message;
              if (typed.loc) return JSON.stringify(typed.loc);
            }
            return typeof item === "string" ? item : "Invalid input";
          })
          .join(", ");
      }
      if (detail && typeof detail === "object") {
        const typed = detail as { msg?: unknown; message?: unknown };
        if (typeof typed.msg === "string") return typed.msg;
        if (typeof typed.message === "string") return typed.message;
      }
      return response.statusText || "Request failed";
    })();

    throw new ApiError(message, response.status, detail);
  }

  return payload as T;
}
