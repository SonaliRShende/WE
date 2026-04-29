const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");
export const API_URL = `${API_BASE_URL}/api`;

export const buildApiUrl = (path, queryParams = {}) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  Object.entries(queryParams || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};
