// src/services/classes/class.api.js

import axios from "./axiosClient.js";

const API =
    import.meta.env.VITE_BASE_URL;

export const getClassesDashboard =
  async () => {

    const response =
      await axios.get(
        `${API}/classes/dashboard`
      );

    return response.data.data;
  };

export const getDashboardInsights =
  async () => {

    const response =
      await axios.get(
        `${API}/classes/dashboard/insights`
      );

    return response.data.data;
  };

export const getClassCatalog =
  async () => {

    const response =
      await axios.get(
        `${API}/classes/catalog`
      );

    return response.data.data;
  };

export const getClassesByStatus =
  async (status = "active", academicYear = "") => {

    const response =
      await axios.get(
        `${API}/classes`,
        {
          params: {
            status,
            academicYear,
          },
        }
      );

    return response.data.data;
  };

export const archiveClass =
  async (classId) => {

    const response =
      await axios.delete(
        `${API}/classes/${classId}`
      );

    return response.data;
  };

export const unarchiveClass =
  async (classId) => {

    const response =
      await axios.patch(
        `${API}/classes/${classId}/unarchive`
      );

    return response.data.data;
  };

export const createClass =
  async (data) => {

    const response =
      await axios.post(
        `${API}/classes`,
        data
      );

    return response.data.data;
  };
