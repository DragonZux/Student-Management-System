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
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

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

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
