import axios from "./axiosClient.js";

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

export const getBotCredentialsStatus =
  async () => {
    const response =
      await axios.get(
        `${API}/settings/whatsapp-bot/status`
      );

    return response.data.data;
  };

export const saveBotCredentials =
  async (data) => {
    const response =
      await axios.post(
        `${API}/settings/whatsapp-bot/credentials`,
        data
      );

    return response.data.data;
  };

export const revokeBotAccess =
  async () => {
    const response =
      await axios.post(
        `${API}/settings/whatsapp-bot/revoke`
      );

    return response.data;
  };

export const sendSupportRequest =
  async (question) => {
    const response =
      await axios.post(
        `${API}/settings/support/help`,
        { question }
      );

    return response.data;
  };

export const toggleBotActiveStatus =
  async (isActive) => {
    const response =
      await axios.post(
        `${API}/settings/whatsapp-bot/active`,
        { isActive }
      );

    return response.data;
  };
