const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");
export const API_URL = `${API_BASE_URL}/api`;

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
