
import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const apiBaseUrl =
  configuredApiBaseUrl && configuredApiBaseUrl.length > 0
    ? configuredApiBaseUrl
    : '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // ✅ sends cookies with requests
  // ❌ Do NOT set a global Content-Type here; let axios/browser decide per request.
});

// Request Interceptor (optional - for logging/debugging)
apiClient.interceptors.request.use(
  (config) => {
    // Detect FormData and ensure header isn't forced
    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (isFormData) {
      // Remove any pre-set Content-Type to allow multipart boundary
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    } else {
      // For non-FormData, axios will set application/json automatically when data is an object.
      // If you want to force JSON, you can uncomment:
      // config.headers = { ...config.headers, 'Content-Type': 'application/json' };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
let isHandlingUnauth = false; // Prevent multiple redirects

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized (not logged in)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        console.log('Unauthorized - redirecting to login');
        //indow.location.href = '/${locale}/login';
      }
    }

    // Handle 403 Forbidden (wrong role/permission)
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        console.log('Forbidden - Access denied to resource');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

