const configuredApiUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = (
  configuredApiUrl || "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

export const apiUrl = (path) =>
  `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
