import { compact, userApi } from "./client.js";

// The logged-in user: name, email and profileKey
export const getMe = () => userApi.get("/user/me");

// Everyone except the logged-in user; searchKey filters by name or email
export const getUsers = ({ pageNo = 1, limit = 10, searchKey } = {}) =>
  userApi.get("/user", { params: compact({ pageNo, limit, searchKey }) });
