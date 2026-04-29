import axios from 'axios';
import { showPopup } from '@/lib/popup';
import { clearAuthCookies, getAuthTokenFromBrowser } from '@/lib/authCookies';

function normalizeBaseUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/$/, '') : '';
}

function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return 'Không thể kết nối máy chủ. Vui lòng thử lại.';

  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }

  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    if (typeof first === 'string') return first;
    if (first?.msg) return first.msg;
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

function showErrorPopup(message) {
  showPopup(message, { type: 'error' });
}

// Use an explicit browser-facing base URL so local dev and Docker do not depend on rewrites.
// The backend container hostname is not resolvable from the browser, so keep a public URL here.
const apiBaseUrl = normalizeBaseUrl(
  typeof window !== 'undefined'
    ? '/api/'
    : (process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:8000/api/')
);

if (typeof window !== 'undefined') {
  console.log('[API] Client Base URL:', apiBaseUrl);
}

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

// Manual retry logic
api.interceptors.response.use(undefined, async (err) => {
  const config = err.config;
  // If config does not exist or the retry option is not set, reject
  if (!config || !config.retry) return Promise.reject(err);

  // Set the variable for keeping track of the retry count
  config.__retryCount = config.__retryCount || 0;

  // Check if we've maxed out the total number of retries
  if (config.__retryCount >= config.retry) {
    return Promise.reject(err);
  }

  // Only retry on network errors or 5xx server errors
  const shouldRetry = !err.response || (err.response.status >= 500);
  if (!shouldRetry) return Promise.reject(err);

  // Increase the retry count
  config.__retryCount += 1;

  // Create new promise to handle exponential backoff
  const backoff = new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, config.retryDelay || 1000 * Math.pow(2, config.__retryCount - 1));
  });

  // Return the promise in which recalls axios
  await backoff;
  return api(config);
});

// Default retry config for all requests
api.defaults.retry = 3;
api.defaults.retryDelay = 1000;


// Add a request interceptor to handle auth token and path normalization
api.interceptors.request.use(
  (config) => {
    // Normalize relative paths so callers can pass `/foo`, `foo`, or `/foo/`
    // without triggering slash-based routing mismatches on the backend.
    if (config.url && !/^https?:\/\//i.test(config.url)) {
      const [pathPart, suffix = ''] = String(config.url).split(/([?#].*)/, 2);
      const normalizedPath = pathPart.replace(/^\/+/, '').replace(/\/+$/, '');
      config.url = `${normalizedPath}${suffix}`;
    }

    const token = typeof window !== 'undefined' ? getAuthTokenFromBrowser() : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const message = extractErrorMessage(error);

    // Show popup for all API errors so users can immediately understand what happened.
    if (status !== 401) {
      showErrorPopup(message);
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const isLoginPath = error.config?.url?.includes('/auth/login');
        const isOnLoginPage = window.location?.pathname === '/login';

        if (isLoginPath) {
          // For login failures, we let the LoginPage handle the error message.
        } else {
          showErrorPopup('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          clearAuthCookies();
          if (!isOnLoginPage) {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
