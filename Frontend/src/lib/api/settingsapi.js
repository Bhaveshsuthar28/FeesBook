import axios from "axios";

const API =
  import.meta.env.VITE_BASE_URL;

export const getSchoolProfile =
  async () => {
    const response =
      await axios.get(
        `${API}/settings/profile`
      );

    return response.data.data;
  };

export const updateSchoolProfile =
  async (data) => {
    const response =
      await axios.patch(
        `${API}/settings/profile`,
        data
      );

    return response.data.data;
  };

export const getSettingsPreferences =
  async () => {
    const response =
      await axios.get(
        `${API}/settings/preferences`
      );

    return response.data.data;
  };

export const updateSettingsPreferences =
  async (data) => {
    const response =
      await axios.patch(
        `${API}/settings/preferences`,
        data
      );

    return response.data.data;
  };

export const getAcademicYears =
  async () => {
    const response =
      await axios.get(
        `${API}/settings/academic-years`
      );

    return response.data.data;
  };

export const createAcademicYear =
  async (data) => {
    const response =
      await axios.post(
        `${API}/settings/academic-years`,
        data
      );

    return response.data.data;
  };

export const setActiveAcademicYear =
  async (year) => {
    const response =
      await axios.patch(
        `${API}/settings/academic-years/active`,
        {
          year,
        }
      );

    return response.data.data;
  };

export const promoteAcademicYear =
  async ({
    year,
    data = {},
  }) => {
    const response =
      await axios.post(
        `${API}/settings/academic-years/${year}/promote`,
        data
      );

    return response.data.data;
  };

export const archiveAcademicYear =
  async ({
    year,
    archived,
  }) => {
    const response =
      await axios.patch(
        `${API}/settings/academic-years/${year}/archive`,
        {
          archived,
        }
      );

    return response.data.data;
  };
