import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';
import { getApiBaseUrl } from '@/lib/api-base';
import { logoutSession, refreshSession, shouldAttemptRefresh } from '@/lib/auth-session';
import { getAuthToken } from '@/stores/auth-store';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;
    if (body && typeof body === 'object' && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const config = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const path = config?.url ?? '';

    if (status === 401 && config && !config._retried && shouldAttemptRefresh(path)) {
      const refreshed = await refreshSession();
      if (refreshed) {
        config._retried = true;
        config.headers.Authorization = `Bearer ${getAuthToken()}`;
        return apiClient.request(config);
      }
      await logoutSession();
    }

    const message = error.response?.data?.message ?? error.message ?? 'Request failed';
    return Promise.reject(new ApiError(message, status ?? 500));
  },
);

export { apiClient as axios };
