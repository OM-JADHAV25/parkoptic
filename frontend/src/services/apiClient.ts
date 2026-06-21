/**
 * Centralized API Client for ParkOptic
 * Handles centralized configuration, environment base URLs, timeout configuration, and standard error handling.
 */

const DEFAULT_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds timeout

export class ApiError extends Error {
  status: number;
  statusText: string;
  data: any;

  constructor(message: string, status: number, statusText: string, data: any = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL;
  const url = `${baseUrl}${endpoint}`;

  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {}, ...rest } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const mergedHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  try {
    const response = await fetch(url, {
      ...rest,
      headers: mergedHeaders,
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        // Response is not JSON or empty
      }
      throw new ApiError(
        errorData?.detail || `API request failed with status ${response.status}`,
        response.status,
        response.statusText,
        errorData
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error: any) {
    clearTimeout(id);

    if (error.name === "AbortError") {
      throw new ApiError("API request timed out", 408, "Request Timeout");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error.message || "Failed to establish connection to backend server",
      500,
      "Internal Client Error"
    );
  }
}

export const apiClient = {
  get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "DELETE" });
  },
};
