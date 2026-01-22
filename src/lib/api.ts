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
  
  if (response.status === 401) {
    document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/';
  }
  
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
    
    if (response.status === 401) {
      document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      window.location.href = '/';
      throw new Error('Unauthorized');
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error, 'for', url);
    throw error;
  }
}

export { API_URL };