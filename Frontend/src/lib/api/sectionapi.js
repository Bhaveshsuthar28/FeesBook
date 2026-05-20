import axios from "./axiosClient.js";

const API =
  import.meta.env.VITE_BASE_URL;

export const getSectionsByClass =
  async ({
    classId,
    status = "active",
  }) => {
    const response =
      await axios.get(
        `${API}/sections/class/${classId}`,
        {
          params: {
            status,
          },
        }
      );

    return response.data.data;
  };

export const getSectionCatalog =
  async (classId) => {
    const response =
      await axios.get(
        `${API}/sections/class/${classId}/catalog`
      );

    return response.data.data;
  };

export const getSectionStats =
  async (classId) => {
    const response =
      await axios.get(
        `${API}/sections/class/${classId}/stats`
      );

    return response.data.data;
  };

export const createSection =
  async (data) => {
    const response =
      await axios.post(
        `${API}/sections`,
        data
      );

    return response.data.data;
  };

export const archiveSection =
  async (sectionId) => {
    const response =
      await axios.delete(
        `${API}/sections/${sectionId}`
      );

    return response.data;
  };

export const unarchiveSection =
  async (sectionId) => {
    const response =
      await axios.patch(
        `${API}/sections/${sectionId}/unarchive`
      );

    return response.data.data;
  };
