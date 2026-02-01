const API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';

function getAuthToken(): string | null {
  const localToken = localStorage.getItem('authToken');
  if (localToken) {
    return localToken;
  }
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth_token') {
      return value;
    }
  }
  
  return null;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('X-Auth-Token', token);
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });
  
  return response;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { 'X-Auth-Token': token } : {};
}

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('X-Auth-Token', token);
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export async function authenticatedFetchNoCreds(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('X-Auth-Token', token);
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export { API_URL };