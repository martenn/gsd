import type { ErrorResponse } from '@gsd/types';

const API_BASE_URL: string = (import.meta.env.PUBLIC_API_URL as string) || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorResponse?: ErrorResponse,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ErrorResponse;
    throw new ApiError(
      errorData.message || 'An error occurred',
      errorData.statusCode || response.status,
      errorData,
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  async get<T>(path: string): Promise<T | null> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, data?: unknown): Promise<T | null> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, data: unknown): Promise<T | null> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T | null> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<T>(response);
  },
};
