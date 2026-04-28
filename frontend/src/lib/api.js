import axios from 'axios';
import { showPopup } from '@/lib/popup';

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
const configuredBrowserApiBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
const apiBaseUrl = normalizeBaseUrl(
  typeof window !== 'undefined'
    ? (/^https?:\/\//i.test(configuredBrowserApiBase) ? configuredBrowserApiBase : 'http://localhost:8000/api')
    : (process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:8000/api')
);

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


// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debug log to see the actual URL being called in the browser
    if (typeof window !== 'undefined') {
      console.log(`API Call: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global GET Request Caching (5 mins)
const CACHE_TTL = 5 * 60 * 1000;

api.interceptors.response.use(
  (response) => {
    // Cache GET requests
    if (response.config.method === 'get' && typeof window !== 'undefined') {
      // Avoid caching some endpoints if needed (like auth check)
      if (!response.config.url.includes('/auth/me')) {
        const cacheKey = `api_cache_${response.config.url}_${JSON.stringify(response.config.params || {})}`;
        const cacheData = {
          data: response.data,
          timestamp: Date.now(),
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (e) {
          console.warn('LocalStorage cache full, clearing old entries');
          Object.keys(localStorage).filter(k => k.startsWith('api_cache_')).forEach(k => localStorage.removeItem(k));
        }
      }
    }
    return response;
  },
  async (error) => {
    // Fallback: use cached data if request fails (and it's a GET)
    if (error.config?.method === 'get' && typeof window !== 'undefined') {
      const cacheKey = `api_cache_${error.config.url}_${JSON.stringify(error.config.params || {})}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          console.info('Serving from stale cache due to network error:', error.config.url);
          return Promise.resolve({ data, config: error.config, __fromCache: true });
        }
      }
    }

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
