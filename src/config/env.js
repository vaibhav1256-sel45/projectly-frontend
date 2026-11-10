// Where each backend service lives. Override in a .env file, e.g. VITE_PROJECT_URL=https://api.example.com
const env = import.meta.env;

export const SERVICES = {
  user: env.VITE_USER_URL ?? "http://localhost:3001",
  project: env.VITE_PROJECT_URL ?? "http://localhost:3002",
  common: env.VITE_COMMON_URL ?? "http://localhost:3003",
  task: env.VITE_TASK_URL ?? "http://localhost:3004",
};
