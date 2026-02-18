import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { getConfig } from '../config/environment';
import { API_CONFIG, HTTP_STATUS } from '../constants/api';
import { AuthTokens, ApiResponse } from '../types';

interface RequestConfig extends AxiosRequestConfig {
  skipAuthRefresh?: boolean;
  retryCount?: number;
}

interface ApiClientConfig {
  onTokenRefresh?: (tokens: AuthTokens) => Promise<void>;
  onAuthError?: () => Promise<void>;
  onLogout?: () => Promise<void>;
  getStoredTokens?: () => Promise<AuthTokens | null>;
}

class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(config: ApiClientConfig = {}) {
    this.config = config;
    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    const appConfig = getConfig();
    
    return axios.create({
      baseURL: appConfig.api_base_url,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        const tokens = await this.config.getStoredTokens?.();
        if (tokens?.access_token) {
          config.headers.Authorization = `Bearer ${tokens.access_token}`;
        }

        // Add device info headers
        config.headers['X-Client-Platform'] = 'mobile';
        config.headers['X-Client-Version'] = '1.0.0';

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        return this.handleResponseError(error);
      }
    );
  }

  private async handleResponseError(error: AxiosError): Promise<any> {
    const originalRequest = error.config as RequestConfig;

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        type: 'NETWORK_ERROR',
        message: 'Please check your internet connection',
        originalError: error,
      });
    }

    const status = error.response.status;

    // Handle 401 Unauthorized
    if (status === HTTP_STATUS.UNAUTHORIZED && !originalRequest.skipAuthRefresh) {
      return this.handleAuthError(originalRequest);
    }

    // Handle 429 Too Many Requests with retry
    if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      return this.handleRateLimitError(originalRequest);
    }

    // Handle 5xx Server Errors with retry
    if (status >= 500 && (originalRequest.retryCount || 0) < API_CONFIG.RETRY_ATTEMPTS) {
      return this.retryRequest(originalRequest);
    }

    // Transform error response
    const errorData = error.response.data as any;
    return Promise.reject({
      status,
      type: this.getErrorType(status),
      message: errorData?.message || error.message,
      errors: errorData?.errors,
      originalError: error,
    });
  }

  private async handleAuthError(originalRequest: RequestConfig): Promise<any> {
    if (this.isRefreshing) {
      // If refresh is already in progress, wait for it
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token: string) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`;
          resolve(this.client(originalRequest));
        });
      });
    }

    this.isRefreshing = true;

    try {
      const tokens = await this.config.getStoredTokens?.();
      if (!tokens?.refresh_token) {
        throw new Error('No refresh token available');
      }

      // Attempt to refresh token
      const refreshResponse = await this.client.post('/auth/refresh', {
        refresh_token: tokens.refresh_token,
      }, {
        skipAuthRefresh: true,
      } as RequestConfig);

      const newTokens = refreshResponse.data.data;
      await this.config.onTokenRefresh?.(newTokens);

      // Retry original request with new token
      originalRequest.headers!.Authorization = `Bearer ${newTokens.access_token}`;
      
      // Resolve all pending requests
      this.refreshSubscribers.forEach((callback) => {
        callback(newTokens.access_token);
      });
      this.refreshSubscribers = [];

      return this.client(originalRequest);
    } catch (refreshError) {
      // Refresh failed, logout user
      await this.config.onAuthError?.();
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }

  private async handleRateLimitError(originalRequest: RequestConfig): Promise<any> {
    const delay = 1000 * (2 ** (originalRequest.retryCount || 0)); // Exponential backoff
    await this.sleep(delay);
    return this.retryRequest(originalRequest);
  }

  private async retryRequest(originalRequest: RequestConfig): Promise<any> {
    const retryCount = (originalRequest.retryCount || 0) + 1;
    
    if (retryCount >= API_CONFIG.RETRY_ATTEMPTS) {
      return Promise.reject({
        type: 'MAX_RETRIES_EXCEEDED',
        message: 'Maximum retry attempts exceeded',
      });
    }

    const delay = API_CONFIG.RETRY_DELAY * retryCount;
    await this.sleep(delay);

    return this.client({
      ...originalRequest,
      retryCount,
    });
  }

  private getErrorType(status: number): string {
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HTTP_STATUS.UNAUTHORIZED:
        return 'AUTHENTICATION_ERROR';
      case HTTP_STATUS.FORBIDDEN:
        return 'AUTHORIZATION_ERROR';
      case HTTP_STATUS.NOT_FOUND:
        return 'NOT_FOUND_ERROR';
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_ERROR';
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return 'SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // File upload method
  async upload<T>(
    url: string,
    formData: FormData,
    config?: RequestConfig & {
      onUploadProgress?: (progressEvent: any) => void;
    }
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  }

  // Update configuration
  updateConfig(newConfig: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get raw axios instance (for advanced usage)
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

export default ApiClient;