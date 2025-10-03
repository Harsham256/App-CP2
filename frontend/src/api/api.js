// FRONTEND/src/api/api.js
import axios from "axios";

const API_BASE = (import.meta?.env?.VITE_API_BASE || "http://localhost:5093").replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 20000
});

api.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Helpers
const get = (url, params) => api.get(url, { params }).then(r => r.data);
const postJson = (url, data) => api.post(url, data, { headers: { "Content-Type": "application/json" } }).then(r => r.data);
const post = (url, data) => api.post(url, data).then(r => r.data);
const del = (url) => api.delete(url).then(r => r.data);

// AUTH
export const login = (username, password) => postJson("/auth/login", { username, password });
export const register = (payload) => postJson("/auth/register", payload);

// USERS
export const getUsers = () => get("/admin/users");
export const createUser = (payload) => postJson("/admin/users", payload);
export const deleteUser = (id) => del(`/admin/users/${id}`);

// DOCUMENTS
export const getDocuments = () => get("/admin/documents");
export const approveDocument = (id) => post(`/admin/documents/${id}/approve`);
export const rejectDocument = (id) => post(`/admin/documents/${id}/reject`);
export const uploadDocument = (file, userId) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("userId", userId);
  return api.post("/document/upload", fd).then(r => r.data); // axios sets multipart headers
};

// REPORT
export const getReport = (documentId) => get(`/report/${documentId}`);

// Optional inline preview URL
export const getInlineDocUrl = (documentId) => `${API_BASE}/api/document/inline/${documentId}`;

export default api;