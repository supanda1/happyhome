/**
 * API Client with HTTP-only cookies and session management
 * SECURITY: No localStorage - uses secure HTTP-only cookies managed by backend
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { config } from './config';
import { createErrorFromResponse } from './errors';

interface TokenStorage {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
}

/**
 * Secure Session-Based Token Storage
 * Uses HTTP-only cookies managed by backend instead of localStorage
 * SECURITY: Protects against XSS attacks
 */
class SessionTokenStorage implements TokenStorage {
  // No localStorage - tokens are managed by HTTP-only cookies
  
  getAccessToken(): string | null {
    // Access token is sent automatically via HTTP-only cookie
    // We don't store it in frontend for security
    return null;
  }

  getRefreshToken(): string | null {
    // Refresh token is sent automatically via HTTP-only cookie  
    // We don't store it in frontend for security
    return null;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    // Tokens are set by backend as HTTP-only cookies
    // Frontend doesn't handle token storage anymore
  }

  clearTokens(): void {
    // Tokens are cleared by calling backend logout endpoint
    // Backend will clear HTTP-only cookies
  }
}

/**
 * @deprecated Legacy localStorage token storage - REMOVED for security
 * Use SessionTokenStorage instead which uses secure HTTP-only cookies
 */
class LocalTokenStorage implements TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  getAccessToken(): string | null {
    console.warn('🚫 SECURITY: LocalTokenStorage is deprecated. Use SessionTokenStorage with HTTP-only cookies.');
    return null; // Disabled for security
  }

  getRefreshToken(): string | null {
    console.warn('🚫 SECURITY: LocalTokenStorage is deprecated. Use SessionTokenStorage with HTTP-only cookies.');
    return null; // Disabled for security
  }

  setTokens(accessToken: string, refreshToken: string): void {
    console.warn('🚫 SECURITY: LocalTokenStorage is deprecated. Tokens managed by backend.');
  }

  clearTokens(): void {
    console.warn('🚫 SECURITY: LocalTokenStorage is deprecated. Use backend logout.');
  }
}

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private tokenStorage: TokenStorage;
  private isRefreshing = false;
  private refreshSubscribers: Array<() => void> = [];
  
  constructor(tokenStorage: TokenStorage = new SessionTokenStorage()) {
    this.tokenStorage = tokenStorage;
    
    this.axiosInstance = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      withCredentials: true, // SECURITY: Enable cookies for HTTP-only auth
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - no manual token handling (HTTP-only cookies are automatic)
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // SECURITY: No manual Authorization header - cookies handle auth automatically
        // Backend will read HTTP-only cookie for authentication
        return config;
      },
      (error) => {
        return Promise.reject(createErrorFromResponse(error));
      }
    );

    // Response interceptor for session-based authentication
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 (Unauthorized) and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If we're already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push(() => {
                this.axiosInstance(originalRequest).then(resolve).catch(reject);
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Try to refresh session with backend
            await this.refreshSession();
            this.onRefreshSuccess();
            // Retry original request - cookies will be updated automatically
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.onRefreshFailure();
            return Promise.reject(createErrorFromResponse(refreshError));
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(createErrorFromResponse(error));
      }
    );
  }

  private async refreshSession(): Promise<void> {
    // SECURITY: Session refresh using HTTP-only cookies
    // Backend will handle token refresh and set new HTTP-only cookies
    await axios.post(
      `${config.apiBaseUrl}/auth/refresh`,
      {}, // No body needed - refresh token is in HTTP-only cookie
      { 
        timeout: config.apiTimeout,
        withCredentials: true // Send HTTP-only cookies
      }
    );
    
    // Backend automatically sets new HTTP-only cookies
    // No frontend token management needed
  }

  private onRefreshSuccess(): void {
    // Retry all queued requests
    this.refreshSubscribers.forEach((callback) => callback());
    this.refreshSubscribers = [];
  }

  private onRefreshFailure(): void {
    // Clear queued requests and logout
    this.refreshSubscribers = [];
    this.tokenStorage.clearTokens();
    
    // Dispatch logout event for app-wide session cleanup
    window.dispatchEvent(new CustomEvent('auth:session_expired'));
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  // File upload
  async uploadFile<T>(url: string, file: File, config?: AxiosRequestConfig): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.axiosInstance.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    
    return response.data;
  }

  // Set authentication tokens (DEPRECATED - handled by backend)
  setTokens(accessToken: string, refreshToken: string): void {
    // SECURITY: Tokens are managed by backend HTTP-only cookies
    // This method is kept for backward compatibility but does nothing
    this.tokenStorage.setTokens(accessToken, refreshToken);
  }

  // Clear authentication session
  async clearTokens(): Promise<void> {
    // SECURITY: Call backend logout to clear HTTP-only cookies
    try {
      await this.post('/auth/logout', {});
    } catch (error) {
      console.warn('Logout request failed, but clearing local session anyway');
    }
    this.tokenStorage.clearTokens();
  }

  // Get current access token (DEPRECATED - not accessible with HTTP-only cookies)
  getAccessToken(): string | null {
    // SECURITY: Access tokens are in HTTP-only cookies and not accessible to frontend
    console.warn('🚫 Access tokens are secure HTTP-only cookies and not accessible to frontend JavaScript');
    return null;
  }

  // Check if user is authenticated (session-based)
  async isAuthenticated(): Promise<boolean> {
    try {
      // Check authentication status with backend
      const response = await this.get('/auth/me');
      return !!response;
    } catch (error) {
      return false;
    }
  }

  // Sync method for backward compatibility (less reliable)
  isAuthenticatedSync(): boolean {
    // This is less reliable since we can't access HTTP-only cookies
    // Use async isAuthenticated() when possible
    console.warn('⚠️ Using sync auth check - prefer async isAuthenticated() for accuracy');
    return false; // Conservative approach - assume not authenticated
  }
}

// Create singleton instance with secure session storage
export const apiClient = new ApiClient();

// Export secure implementations
export { SessionTokenStorage };

// Export legacy implementation (deprecated)
export { LocalTokenStorage };

// Export types
export type { TokenStorage };