/**
 * Shared API Client
 * Cliente HTTP base reutilizable en toda la aplicación
 */

import { logger } from '@/shared/lib';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class BaseApiClient {
  constructor(private readonly baseURL: string) {}

  private buildURL(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText
      }));

      logger.error('HTTP request failed', errorData, {
        status: response.status,
      });
      
      throw new ApiError(
        errorData.message || `HTTP Error: ${response.status}`,
        response.status,
        errorData
      );
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const token = localStorage.getItem('accessToken');
    const headers = new Headers(customHeaders);
    headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers: this.getHeaders(options?.headers),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: this.getHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      headers: this.getHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async deleteBase<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      headers: this.getHeaders(options?.headers),
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      ...options,
      method: 'PATCH',
      headers: this.getHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }
}
