import Constants from 'expo-constants';
import { getLocale } from './i18n';

interface AppExtra {
  apiUrl?: string;
  apiKey?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

/**
 * Base URL of the Laravel backend. Change this in `app.json` → `extra.apiUrl`
 * (e.g. your LAN IP, `http://10.0.2.2:8000` for Android emulator, or a tunnel).
 */
export const API_URL = (extra.apiUrl ?? 'http://localhost:8000').replace(/\/+$/, '');

/**
 * The global `X-API-Key` middleware value (see `PYTHON_API_KEY` in the backend `.env`).
 */
export const API_KEY = extra.apiKey ?? '';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: string;
  /** JSON body (automatically serialized). */
  body?: unknown;
  /** Multipart body (FormData) — takes precedence over `body`. */
  formData?: FormData;
  /** Override the auth token (e.g. `null` to skip auth for login). */
  token?: string | null;
}

/**
 * Thin fetch wrapper that injects the base URL, API key, and bearer token,
 * and normalizes JSON + error responses.
 */
export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': getLocale(),
    'X-API-Key': API_KEY,
  };

  const token = options.token !== undefined ? options.token : authToken;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: unknown;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: body as BodyInit | undefined,
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(
      `Cannot reach the server at ${API_URL}. Is the backend running?`,
      0,
    );
  } finally { clearTimeout(timeout); }

  const text = await response.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      (json && typeof json.message === 'string' && json.message) ||
      (json && typeof json.error === 'string' && json.error) ||
      `Request failed (${response.status})`;
    const errors = json?.errors as Record<string, string[]> | undefined;
    throw new ApiError(errors ? Object.values(errors).flat().join('\n') : message, response.status, errors);
  }

  return json as T;
}
