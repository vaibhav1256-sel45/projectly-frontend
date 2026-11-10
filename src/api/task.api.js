import { compact, taskApi } from "./client.js";

export const listTasks = ({ projectId, pageNo = 1, limit = 100, status, priority, searchKey, assignee }) =>
  taskApi.get("/tasks", { params: compact({ projectId, pageNo, limit, status, priority, searchKey, assignee }) });

export const createTask = (payload) => taskApi.post("/tasks", payload);
export const updateTask = (id, payload) => taskApi.patch(`/tasks/${id}`, payload);

export const listComments = (taskId, { pageNo = 1, limit = 10 } = {}) =>
  taskApi.get(`/tasks/${taskId}/comments`, { params: { pageNo, limit } });
// `mentions` = ids of the people @mentioned in the comment; they get an email
export const addComment = (taskId, content, mentions = []) =>
  taskApi.post(`/tasks/${taskId}/comments`, mentions.length ? { content, mentions } : { content });

// Who changed what on a task, newest first
export const listHistory = (taskId, { pageNo = 1, limit = 10 } = {}) =>
  taskApi.get(`/tasks/${taskId}/history`, { params: { pageNo, limit } });

// Attachments are uploaded to S3 first (see uploadAttachment). They are saved with the task: createTask({ attachments }),
// updateTask(id, { addAttachments, removeAttachments }).
