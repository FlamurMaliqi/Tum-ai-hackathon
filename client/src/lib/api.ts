// API configuration
// In development, Vite proxy handles /api routes
// In production, use environment variable or default to server service name
const getApiBaseUrl = (): string => {
  // Check for explicit API URL (useful for Docker/production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use relative paths (Vite proxy will handle it)
  if (import.meta.env.DEV) {
    return '';
  }
  
  // In production (Docker), default to localhost (browser runs on user's machine)
  // This will be overridden by VITE_API_URL if set
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiUrl = (path: string): string => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If API_BASE_URL is empty (dev mode with proxy), return path as-is
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  
  // Otherwise, combine base URL with path
  return `${API_BASE_URL}${normalizedPath}`;
};

