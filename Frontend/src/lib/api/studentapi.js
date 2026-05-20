import axios from "axios";

const API =
  import.meta.env.VITE_BASE_URL;

export const getStudentsBySection =
  async ({
    classId,
    sectionId,
    page = 1,
    limit = 10,
    search = "",
    paymentStatus = "",
    sortBy = "rollNumber",
  }) => {
    const response =
      await axios.get(
        `${API}/students/class/${classId}/section/${sectionId}`,
        {
          params: {
            page,
            limit,
            search,
            paymentStatus,
            sortBy,
          },
        }
      );

    return response.data.data;
  };

export const getStudentDirectory =
  async ({
    status = "all",
    page = 1,
    limit = 10,
    search = "",
    classId = "",
    sectionId = "",
    paymentStatus = "",
    sortBy = "rollNumber",
  }) => {
    const response =
      await axios.get(
        `${API}/students`,
        {
          params: {
            status,
            page,
            limit,
            search,
            classId,
            sectionId,
            paymentStatus,
            sortBy,
          },
        }
      );

    return response.data.data;
  };

export const getFeesLedger =
  async ({
    status = "All",
    page = 1,
    limit = 10,
    search = "",
    classId = "",
    sectionId = "",
    monthYear = "",
    paymentMode = "",
    sortBy = "rollNumber",
  }) => {
    const response =
      await axios.get(
        `${API}/students/fees-ledger`,
        {
          params: {
            status,
            page,
            limit,
            search,
            classId,
            sectionId,
            monthYear,
            paymentMode,
            sortBy,
          },
        }
      );

    return response.data.data;
  };

export const createStudent =
  async (data) => {
    const response =
      await axios.post(
        `${API}/students`,
        data
      );

    return response.data.data;
  };

export const getStudentDetail =
  async (studentId) => {
    const response =
      await axios.get(
        `${API}/students/${studentId}`
      );

    return response.data.data;
  };

export const updateStudent =
  async ({
    studentId,
    data,
  }) => {
    const response =
      await axios.patch(
        `${API}/students/${studentId}`,
        data
      );

    return response.data.data;
  };

export const markStudentLeft =
  async ({
    studentId,
    data = {},
  }) => {
    const response =
      await axios.patch(
        `${API}/students/${studentId}/left`,
        data
      );

    return response.data.data;
  };

export const markStudentAlumni =
  async ({
    studentId,
    data = {},
  }) => {
    const response =
      await axios.patch(
        `${API}/students/${studentId}/alumni`,
        data
      );

    return response.data.data;
  };

export const promoteStudent =
  async ({
    studentId,
    data = {},
  }) => {
    const response =
      await axios.patch(
        `${API}/students/${studentId}/promote`,
        data
      );

    return response.data.data;
  };

export const bulkPromoteStudents =
  async (data = {}) => {
    const response =
      await axios.post(
        `${API}/students/promote/bulk`,
        data
      );

    return response.data.data;
  };

export const updateStudentFee =
  async ({
    studentId,
    feeId,
    data,
  }) => {
    const response =
      await axios.patch(
        `${API}/students/${studentId}/fees/${feeId}`,
        data
      );

    return response.data.data;
  };

export const recordStudentPayment =
  async ({
    studentId,
    data,
  }) => {
    const response =
      await axios.post(
        `${API}/students/${studentId}/payments`,
        data
      );

    return response.data.data;
  };

export const downloadStudentPaymentReceipt =
  async ({
    studentId,
    paymentId,
  }) => {
    const response =
      await axios.get(
        `${API}/students/${studentId}/payments/${paymentId}/receipt.pdf`,
        {
          responseType: "blob",
        }
      );

    return {
      blob:
        response.data,
      fileName:
        response.headers["content-disposition"]
          ?.match(/filename="(.+)"/)?.[1] ||
        `fee-receipt-${paymentId}.pdf`,
    };
  };

export const importStudents =
  async (data) => {
    const response =
      await axios.post(
        `${API}/students/import`,
        data
      );

    return response.data.data;
  };

export const getImageKitAuth =
  async () => {
    const response =
      await axios.get(
        `${API}/students/imagekit-auth`
      );

    return response.data.data;
  };
