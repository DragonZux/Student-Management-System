import { cookies } from 'next/headers';

function normalizeBaseUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/$/, '') : '';
}

export async function serverApiFetch(path, options = {}) {
  const baseUrl = normalizeBaseUrl(
    process.env.INTERNAL_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:8000/api'
  );
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sms_token')?.value;

    const fetchUrl = `${baseUrl}/${normalizedPath}`;
    console.log(`[SERVER API] Fetching: ${fetchUrl}`);
    
    const response = await fetch(fetchUrl, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      let message = `API request failed with status ${response.status}`;
      try {
        const data = await response.json();
        message = data?.detail || data?.message || message;
      } catch (e) {
        const text = await response.text();
        if (text) message = text;
      }
      console.error(`[SERVER API] Error: ${message}`);
      throw new Error(message);
    }

    const data = await response.json();
    console.log(`[SERVER API] Success:`, data);
    return data;
  } catch (error) {
    console.error(`[SERVER API] Exception:`, error);
    throw error;
  }
}
