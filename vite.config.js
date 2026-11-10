import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server forwards API calls to each service, so the browser needs no CORS setup.
const userService = process.env.VITE_USER_URL ?? "http://localhost:3001";
const projectService = process.env.VITE_PROJECT_URL ?? "http://localhost:3002";
const taskService = process.env.VITE_TASK_URL ?? "http://localhost:3004";
const commonService = process.env.VITE_COMMON_URL ?? "http://localhost:3003";

// A page refresh on /tasks/:id/board is a browser navigation (it asks for HTML), not an API call.
// Serve the app for those instead of forwarding them to the service.
const apiOnly = (target) => ({
  target,
  bypass: (req) => (req.headers.accept?.includes("text/html") ? "/index.html" : undefined),
});

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/user": apiOnly(userService),
      "/project": apiOnly(projectService),
      "/tasks": apiOnly(taskService),
      "/uploads": commonService,
    },
  },
});
