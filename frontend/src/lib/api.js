import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

if (!BACKEND_URL) {
  // Fail loudly in dev rather than silently hitting a relative "/api/undefined" URL.
  // eslint-disable-next-line no-console
  console.error("REACT_APP_BACKEND_URL is not set. Check your .env file.");
}

export const TOKEN_KEY = "sunsafe-token";

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  let token = null;
  try {
    token = window.localStorage?.getItem(TOKEN_KEY);
  } catch {
    // localStorage unavailable (e.g. private browsing) — request goes out unauthenticated.
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(err, fallback = "Something went wrong") {
  return err?.response?.data?.detail || err?.message || fallback;
}
