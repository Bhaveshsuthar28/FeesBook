import axios from "./axiosClient.js";

const API =
  import.meta.env.VITE_BASE_URL;

const parseContentDispositionFileName = (
  headerValue
) => {
  if (
    !headerValue ||
    typeof headerValue !== "string"
  ) {
    return null;
  }

  const utf8Match =
    headerValue.match(
      /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;\s]+)/i
    );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(
        utf8Match[1].trim()
      );
    } catch {
      /* fall through */
    }
  }

  const quoted =
    headerValue.match(
      /filename\s*=\s*"((?:[^"\\]|\\.)*)"/i
    );

  if (quoted?.[1]) {
    return quoted[1].replace(
      /\\"/g,
      '"'
    );
  }

  const single =
    headerValue.match(
      /filename\s*=\s*'([^']*)'/i
    );

  if (single?.[1]) {
    return single[1];
  }

  const unquoted =
    headerValue.match(
      /filename\s*=\s*([^;\s]+)/i
    );

  if (unquoted?.[1]) {
    return unquoted[1];
  }

  return null;
};

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

    const disposition =
      response.headers["content-disposition"] ||
      response.headers["Content-Disposition"];
    const parsedName =
      parseContentDispositionFileName(
        disposition
      );

    return {
      blob:
        response.data,
      fileName:
        parsedName ||
        `fee-receipt-${paymentId}.pdf`,
    };
  };

export const getStudentFeeConcession =
  async ({
    studentId,
    academicYear = "",
  }) => {
    const response =
      await axios.get(
        `${API}/students/${studentId}/concessions`,
        {
          params: {
            academicYear,
          },
        }
      );

    return response.data.data;
  };

export const saveStudentFeeConcession =
  async ({
    studentId,
    data,
  }) => {
    const response =
      await axios.put(
        `${API}/students/${studentId}/concessions`,
        data
      );

    return response.data.data;
  };

export const removeStudentFeeConcession =
  async ({
    studentId,
    concessionId,
  }) => {
    const response =
      await axios.delete(
        `${API}/students/${studentId}/concessions/${concessionId}`
      );

    return response.data.data;
  };

export const downloadStudentFeeConcessionReceipt =
  async ({
    studentId,
    concessionId,
  }) => {
    const response =
      await axios.get(
        `${API}/students/${studentId}/concessions/${concessionId}/receipt.pdf`,
        {
          responseType: "blob",
        }
      );

    return {
      blob: response.data,
      fileName:
        response.headers["content-disposition"]
          ?.match(/filename="(.+)"/)?.[1] ||
        `fee-concession-${concessionId}.pdf`,
    };
  };

export const downloadReceiptBlob =
  ({ blob, fileName }) => {
    const url =
      URL.createObjectURL(blob);
    const link =
      document.createElement("a");
    link.href = url;
    link.download =
      fileName || "receipt.pdf";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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

export const promoteStream =
  async (data = {}) => {
    const response =
      await axios.post(
        `${API}/students/promote/stream`,
        data
      );

    return response.data.data;
  };

export const getStudentEnrollmentHistory =
  async (studentId) => {
    const response =
      await axios.get(
        `${API}/enrollments/student/${studentId}`
      );

    return response.data.data;
  };
