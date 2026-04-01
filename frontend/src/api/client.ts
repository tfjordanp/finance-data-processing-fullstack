import axios, { type AxiosError } from "axios";
import type { ApiErrorBody } from "./types";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "finance_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = String(error.config?.url ?? "");
      if (!url.includes("/auth/login")) {
        setStoredToken(null);
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err: unknown, fallback = "Request failed"): string {
  const ax = err as AxiosError<ApiErrorBody>;
  const msg = ax.response?.data?.message;
  return typeof msg === "string" && msg.trim() ? msg : fallback;
}
