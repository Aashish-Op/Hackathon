const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8000";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getBackendBaseUrl(): string {
  const configured =
    process.env.VIGILO_BACKEND_URL || process.env.NEXT_PUBLIC_VIGILO_BACKEND_URL;

  return normalizeBaseUrl(configured || DEFAULT_BACKEND_BASE_URL);
}

export async function fetchBackendData<T>(path: string): Promise<T> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Backend request failed for ${path}: ${response.status} ${response.statusText}${responseText ? ` - ${responseText}` : ""}`,
    );
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (!envelope?.success) {
    throw new Error(envelope?.message || `Backend responded with unsuccessful status for ${path}`);
  }

  return envelope.data;
}
