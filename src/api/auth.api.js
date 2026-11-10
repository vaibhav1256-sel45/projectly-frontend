import { userApi } from "./client.js";

export const register = (payload) => userApi.post("/user/register", payload);
export const login = (payload) => userApi.post("/user/login", payload);
export const logout = () => userApi.post("/user/logout");
export const verifyOtp = (payload) => userApi.post("/user/verify-otp", payload);
