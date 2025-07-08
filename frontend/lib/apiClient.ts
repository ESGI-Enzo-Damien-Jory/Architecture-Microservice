import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor(
    baseURL: string = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
      "http://localhost:3001"
  ) {
    this.axiosInstance = axios.create({
      baseURL,
      withCredentials: true,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.initializeInterceptors();
  }

  private processQueue(error: any, token: string | null = null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private initializeInterceptors(): void {
    // Request interceptor - add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Import useAuth inside the interceptor to avoid circular dependency
        const { useAuth } = require("@/lib/authStore");
        const token = useAuth.getState().accessToken;

        if (token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(
          `[API_CLIENT] ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error("[API_CLIENT] Request error:", error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(
          `[API_CLIENT] ${
            response.status
          } ${response.config.method?.toUpperCase()} ${response.config.url}`
        );
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry
        ) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.axiosInstance.request(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const { useAuth } = require("@/lib/authStore");
            console.log(
              "[API_CLIENT] Access token expired, attempting refresh"
            );

            const success = await useAuth.getState().refreshAccessToken();

            if (success) {
              const newToken = useAuth.getState().accessToken;
              console.log("[API_CLIENT] Token refresh successful");

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }

              this.processQueue(null, newToken);
              return this.axiosInstance.request(originalRequest);
            } else {
              console.log(
                "[API_CLIENT] Token refresh failed, redirecting to login"
              );
              this.processQueue(error, null);

              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
              return Promise.reject(error);
            }
          } catch (refreshError) {
            console.error("[API_CLIENT] Token refresh error:", refreshError);
            this.processQueue(refreshError, null);

            const { useAuth } = require("@/lib/authStore");
            useAuth.getState().logout();

            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        console.error(
          `[API_CLIENT] ${error.response?.status || "Network"} error:`,
          {
            url: originalRequest?.url,
            method: originalRequest?.method,
            message: error.message,
            response: error.response?.data,
          }
        );

        return Promise.reject(error);
      }
    );
  }

  public async get<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint, config);
    return response.data;
  }

  public async post<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data, config);
    return response.data;
  }

  public async put<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.put<T>(endpoint, data, config);
    return response.data;
  }

  public async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.patch<T>(endpoint, data, config);
    return response.data;
  }

  public async delete<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint, config);
    return response.data;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.get("/health");
      return true;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();