const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const TOKEN_COOKIE = 'sms_token';
const ROLE_COOKIE = 'sms_role';

function setCookie(name, value, maxAgeSeconds) {
  if (typeof document === 'undefined') return;

  const encodedValue = encodeURIComponent(value || '');
  document.cookie = `${name}=${encodedValue}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function deleteCookie(name) {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function readCookie(name) {
  if (typeof document === 'undefined') return null;

  const prefix = `${name}=`;
  const item = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

export function getAuthTokenFromBrowser() {
  if (typeof window === 'undefined') return null;

  return localStorage.getItem(TOKEN_KEY) || readCookie(TOKEN_COOKIE);
}

export function getUserFromBrowserStorage() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function syncAuthCookies(token, role) {
  if (!token) return;

  const maxAgeSeconds = 60 * 60 * 24;
  setCookie(TOKEN_COOKIE, token, maxAgeSeconds);
  if (role) setCookie(ROLE_COOKIE, role, maxAgeSeconds);
}

export function clearAuthCookies() {
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(ROLE_COOKIE);
}
