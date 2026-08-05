import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

if (!BACKEND_URL) {
  // Fail loudly in dev rather than silently hitting a relative "/api/undefined" URL.
  // eslint-disable-next-line no-console
  console.error("REACT_APP_BACKEND_URL is not set. Check your .env file.");
}

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 15000,
});

export function getErrorMessage(err, fallback = "Something went wrong") {
  return err?.response?.data?.detail || err?.message || fallback;
}
