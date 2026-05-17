// src/services/classes/class.api.js

import axios from "axios";

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

export const deleteClass =
  async (classId) => {

    const response =
      await axios.delete(
        `${API}/classes/${classId}`
      );

    return response.data;
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