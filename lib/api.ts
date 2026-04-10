"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface ApiError {
  message: string;
  status: number;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildQueryString(params?: QueryParams): string {
  if (!params) {
    return "";
  }

  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    search.set(key, String(value));
  });

  const result = search.toString();
  return result ? `?${result}` : "";
}

function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw {
      message: "Missing NEXT_PUBLIC_API_URL",
      status: 500,
    } satisfies ApiError;
  }

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      message?: string;
      detail?: string;
      error?: string;
    };

    return payload.message || payload.detail || payload.error || "Request failed";
  } catch {
    return response.statusText || "Request failed";
  }
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options?: {
    params?: QueryParams;
    body?: unknown;
  },
): Promise<T> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers({
    Accept: "application/json",
  });

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  if (options?.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${getBaseUrl()}${normalizePath(path)}${buildQueryString(options?.params)}`;

  const response = await fetch(url, {
    method,
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (response.status === 401) {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    throw {
      message: "Unauthorized",
      status: 401,
    } satisfies ApiError;
  }

  if (!response.ok) {
    throw {
      message: await parseErrorMessage(response),
      status: response.status,
    } satisfies ApiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function requestBlob(
  path: string,
  params?: QueryParams,
): Promise<Blob> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers();
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const url = `${getBaseUrl()}${normalizePath(path)}${buildQueryString(params)}`;
  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw {
      message: "Unauthorized",
      status: 401,
    } satisfies ApiError;
  }

  if (!response.ok) {
    throw {
      message: await parseErrorMessage(response),
      status: response.status,
    } satisfies ApiError;
  }

  return response.blob();
}

export const api = {
  get<T>(path: string, params?: QueryParams) {
    return request<T>("GET", path, { params });
  },

  post<T>(path: string, body?: unknown) {
    return request<T>("POST", path, { body });
  },

  patch<T>(path: string, body?: unknown) {
    return request<T>("PATCH", path, { body });
  },

  delete<T>(path: string) {
    return request<T>("DELETE", path);
  },

  getBlob(path: string, params?: QueryParams) {
    return requestBlob(path, params);
  },
};
