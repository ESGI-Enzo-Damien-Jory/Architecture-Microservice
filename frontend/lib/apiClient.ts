import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { useAuth } from "@/lib/authStore";

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(
    baseURL: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
  ) {
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
    this.initializeInterceptors();
  }

  private initializeInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = useAuth.getState().accessToken;
        if (token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isAxiosError(error) && error.config) {
          const originalRequest = error.config as AxiosRequestConfig & {
            _retry?: boolean;
          };
          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const success = await useAuth.getState().refreshAccessToken();
            if (success) {
              const newToken = useAuth.getState().accessToken;
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return this.axiosInstance.request(originalRequest);
            }
            useAuth.getState().logout();
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public async get<T>(endpoint: string): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint);
    return response.data;
  }

  public async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data);
    return response.data;
  }
}

export const apiClient = new ApiClient();
