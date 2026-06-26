import axios from "./axiosClient.js";

const API = import.meta.env.VITE_BASE_URL;

export const getPromotionDashboard = async () => {
  const r = await axios.get(`${API}/promotion`);
  return r.data.data;
};

export const getPromotionStudents = async ({ classId, sectionId, status } = {}) => {
  const r = await axios.get(`${API}/promotion/students`, {
    params: { classId, sectionId, status },
  });
  return r.data.data;
};

export const getAlumniDirectory = async ({ search, page, limit } = {}) => {
  const r = await axios.get(`${API}/promotion/alumni`, {
    params: { search, page, limit },
  });
  return r.data.data;
};

export const getFailedStudents = async () => {
  const r = await axios.get(`${API}/promotion/failed`);
  return r.data.data;
};

export const getPromotionPreview = async ({ fromClassId, toClassId }) => {
  const r = await axios.get(`${API}/promotion/preview`, {
    params: { fromClassId, toClassId },
  });
  return r.data.data;
};

export const bulkPromoteStudents = async (data) => {
  const r = await axios.post(`${API}/students/promote/bulk`, data);
  return r.data.data;
};

export const streamAllocate = async (data) => {
  const r = await axios.post(`${API}/students/promote/stream`, data);
  return r.data.data;
};
