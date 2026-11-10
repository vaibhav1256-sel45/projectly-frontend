import { compact, projectApi } from "./client.js";

export const listProjects = ({ pageNo, limit, status, searchKey }) =>
  projectApi.get("/project/list", { params: compact({ pageNo, limit, status, searchKey }) });

export const createProject = (payload) => projectApi.post("/project", payload);
export const updateProject = (id, payload) => projectApi.patch(`/project/${id}`, payload);
export const deleteProject = (id) => projectApi.delete(`/project/${id}`);

// Owner + members of a project; searchKey filters by name or email
export const listProjectMembers = (projectId, { searchKey } = {}) =>
  projectApi.get(`/project/${projectId}/members`, { params: compact({ searchKey }) });

// Invitations to join a project: the invited user accepts or declines
export const listInvitations = ({ pageNo = 1, limit = 3 } = {}) =>
  projectApi.get("/project/invitations", { params: { pageNo, limit } });
export const acceptInvitation = (id) => projectApi.post(`/project/invitations/${id}/accept`);
export const declineInvitation = (id) => projectApi.post(`/project/invitations/${id}/decline`);

// Dashboard numbers: tasks by status / priority, workload per person, overdue and due soon
export const getProjectStats = (projectId) => projectApi.get(`/project/${projectId}/statistics`);
