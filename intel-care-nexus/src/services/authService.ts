import {
  getAccessToken,
  clearAuthTokens,
  getRefreshToken,
  request,
  setAuthTokens,
} from "@/lib/api";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  emergency_contact?: string | null;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
};

export type UserUpdate = Partial<{
  name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  emergency_contact: string;
}>;

function getJwtExpiry(token: string): number | null {
  try {
    const payloadPart = token.split(".")[1] ?? "";
    const json =
      typeof atob === "function"
        ? atob(payloadPart)
        : Buffer.from(payloadPart, "base64").toString("utf-8");
    const payload = JSON.parse(json);
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export const authService = {
  async register(
    data: {
      name: string;
      email: string;
      phone: string;
      password: string;
      date_of_birth?: string;
      gender?: string;
      emergency_contact?: string;
    },
    persist = true,
  ) {
    const tokens = await request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    setAuthTokens(tokens, persist);
    return tokens;
  },

  async login(email: string, password: string, persist = true) {
    const tokens = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setAuthTokens(tokens, persist);
    return tokens;
  },

  async logout(): Promise<void> {
    try {
      await request<void>("/auth/logout", { method: "POST" });
    } finally {
      clearAuthTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    return request<User>("/auth/me");
  },

  async updateProfile(data: UserUpdate): Promise<User> {
    return request<User>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const tokens = await request<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    setAuthTokens(tokens, true);
    return tokens;
  },
};

export async function ensureAuthenticated(): Promise<boolean> {
  const accessToken = getAccessToken();
  if (accessToken) {
    const expiry = getJwtExpiry(accessToken);
    if (expiry == null || expiry * 1000 > Date.now()) {
      return true;
    }
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    await authService.refreshToken();
    return true;
  } catch {
    clearAuthTokens();
    return false;
  }
}
