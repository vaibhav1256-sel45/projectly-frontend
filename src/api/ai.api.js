import { createTask } from "./task.api.js";
import { taskApi } from "./client.js";

// AI task suggestions (task-service, Groq through LangChain). Set VITE_AI_MOCK=true in .env
// to use the sample data below instead, e.g. without a GROQ_API_KEY.
//
// Backend contract (task-service):
//
//   POST /tasks/projects/:projectId/suggestions        permission: edit
//   body     { requirement: string }                    20–4000 chars
//   response { success, message, data: { suggestions: [
//              { title, description, type: TASK|BUG|STORY, priority: LOW|MEDIUM|HIGH|URGENT } ] } }
//   Nothing is saved. The server calls the LLM, validates every item and drops the bad ones (max 15).
//
//   POST /tasks/projects/:projectId/bulk                permission: edit
//   body     { tasks: [{ title, description, type, priority, assignee? }] }   1–15 items
//   response { success, message, data: Task[] }
//   Validated again (the user edited them), saved with insertMany, one history entry per task.
export const AI_MOCK = import.meta.env.VITE_AI_MOCK === "true";

export const suggestTasks = (projectId, requirement) =>
  AI_MOCK ? mockSuggest(requirement) : taskApi.post(`/tasks/projects/${projectId}/suggestions`, { requirement });

export const createTasksBulk = (projectId, tasks) =>
  AI_MOCK
    ? Promise.all(tasks.map((t) => createTask({ ...t, projectId, status: "TODO" }))).then((res) => ({ data: res.map((r) => r.data) }))
    : taskApi.post(`/tasks/projects/${projectId}/bulk`, { tasks });

// ---- mock: fake LLM output shaped like the real response ----

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function mockSuggest(requirement) {
  await wait(1800);
  // "Users should be able to reset their password by email. ..." -> "reset their password by email"
  const feature = requirement.split(/[.\n]/)[0].replace(/^(as a \w+,?\s*)?(i want|users? (can|should)|we need)( be able)?( to)?\s*/i, "").trim().slice(0, 60) || "the feature";
  return {
    success: true,
    message: "Suggestions generated",
    data: {
      suggestions: [
        { title: `Write user story: ${feature}`, description: `Describe who needs "${feature}", why, and the acceptance criteria.`, type: "STORY", priority: "HIGH" },
        { title: `Design the screens for ${feature}`, description: "Empty, loading, error and success states. Mobile width too.", type: "TASK", priority: "MEDIUM" },
        { title: `Build the API for ${feature}`, description: "Endpoint, DTO validation and permission check.", type: "TASK", priority: "HIGH" },
        { title: `Build the UI for ${feature}`, description: "Wire the screens to the API and handle errors.", type: "TASK", priority: "MEDIUM" },
        { title: `Write tests for ${feature}`, description: "Unit tests for the service, one e2e test for the main flow.", type: "TASK", priority: "LOW" },
      ],
    },
  };
}
