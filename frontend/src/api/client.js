import axios from "axios";

const resolveBaseURL = () => {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim();
  if (!envUrl) return "/api";
  return envUrl.endsWith("/api") ? envUrl : `${envUrl.replace(/\/+$/, "")}/api`;
};

const api = axios.create({
  baseURL: resolveBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
