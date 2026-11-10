import axios from "axios";
import { SERVICES } from "../config/env.js";
import { clearTokens, getTokens } from "../utils/auth.js";

// Every success body is { success: true, message, data, meta? } (common-service answers with the bare data).
// Every error body is { success: false, error: { code, message } }.

// Builds an axios instance for one service. Interceptors handle the things every call needs:
//  - request:  attach the access token
//  - response: hand back the body, and turn any failure into an Error with a readable message
function createClient(baseURL, { withToken = true } = {}) {
  const client = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });

  client.interceptors.request.use((config) => {
    const token = withToken ? getTokens()?.access_token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (!error.response) {
        return Promise.reject(new Error("Cannot reach the server. Is the backend running?"));
      }

      const { status, data } = error.response;

      // the session expired or was replaced by a newer login
      if (status === 401 && error.config?.headers?.Authorization) {
        clearTokens();
        window.location.assign("/login");
        return Promise.reject(new Error("Your session has ended. Please log in again."));
      }

      const message = data?.error?.message ?? data?.message ?? "Something went wrong";
      return Promise.reject(new Error(Array.isArray(message) ? message.join(", ") : message));
    },
  );

  return client;
}

export const userApi = createClient(SERVICES.user);
export const projectApi = createClient(SERVICES.project);
export const taskApi = createClient(SERVICES.task);
// common-service only needs the file name or key, so it never gets the access token
export const commonApi = createClient(SERVICES.common, { withToken: false });

// Drops empty values so they are not sent as "?status=&searchKey="
export const compact = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));
