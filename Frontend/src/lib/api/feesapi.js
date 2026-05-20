import axios from "axios";

const API =
  import.meta.env.VITE_BASE_URL;

export const getFeeStructure =
  async () => {
    const response =
      await axios.get(
        `${API}/fees/structure`
      );

    return response.data.data;
  };

export const createFeeType =
  async (data) => {
    const response =
      await axios.post(
        `${API}/fees/types`,
        data
      );

    return response.data.data;
  };

export const updateFeeType =
  async ({
    feeTypeId,
    data,
  }) => {
    const response =
      await axios.patch(
        `${API}/fees/types/${feeTypeId}`,
        data
      );

    return response.data;
  };

export const archiveFeeType =
  async ({
    feeTypeId,
    isArchived = true,
  }) => {
    const response =
      await axios.patch(
        `${API}/fees/types/${feeTypeId}/archive`,
        {
          isArchived,
        }
      );

    return response.data;
  };

export const assignFeeToClass =
  async (data) => {
    const response =
      await axios.post(
        `${API}/fees/assign`,
        data
      );

    return response.data.data;
  };

export const updateClassFee =
  async ({
    classFeeId,
    data,
  }) => {
    const response =
      await axios.patch(
        `${API}/fees/assign/${classFeeId}`,
        data
      );

    return response.data;
  };

export const archiveClassFee =
  async ({
    classFeeId,
    isArchived = true,
  }) => {
    const response =
      await axios.patch(
        `${API}/fees/assign/${classFeeId}/archive`,
        {
          isArchived,
        }
      );

    return response.data;
  };

export const allocateClassFees =
  async (data) => {
    const response =
      await axios.post(
        `${API}/fees/allocate`,
        data
      );

    return response.data.data;
  };
