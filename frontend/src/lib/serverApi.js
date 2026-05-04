import { cookies } from 'next/headers';

function normalizeBaseUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/$/, '') : '';
}

export async function serverApiFetch(path, options = {}) {
  const baseUrl = normalizeBaseUrl(
    process.env.INTERNAL_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://backend:8000/api'
  );
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  const token = cookies().get('sms_token')?.value;

  const response = await fetch(`${baseUrl}/${normalizedPath}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data?.detail || data?.message || message;
    } catch {
      // Keep the status-based message.
    }
    throw new Error(message);
  }

  return response.json();
}
