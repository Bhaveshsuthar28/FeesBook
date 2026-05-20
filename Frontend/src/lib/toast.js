import toast from "react-hot-toast";

const sensitivePattern =
  /(?:\bat\s+\w+\b|\.js:\d+|\.jsx:\d+|ECONNREFUSED|ENOTFOUND|SQLITE|sql\s|undefined is not|Cannot read prop|token|secret|password|Bearer\s|sk_|pk_|IMAGEKIT|DATABASE_URL|clerk|stack trace|axios|Network Error|getaddrinfo|SyntaxError|TypeError:\s)/i;

const statusMessages = {
  400: "Please check your input and try again.",
  401: "Please sign in again.",
  403: "You do not have permission to do that.",
  404: "The requested item was not found.",
  409: "This action conflicts with existing data.",
  422: "Please check your input and try again.",
  429: "Too many requests. Please wait a moment.",
  500: "Something went wrong. Please try again later.",
  503: "Service is temporarily unavailable.",
};

const isSafeUserMessage =
  (message) => {
    if (
      typeof message !==
      "string"
    ) {
      return false;
    }

    const trimmed =
      message.trim();

    if (
      !trimmed ||
      trimmed.length > 160
    ) {
      return false;
    }

    if (
      sensitivePattern.test(
        trimmed
      )
    ) {
      return false;
    }

    if (
      /[{[\]}]/.test(
        trimmed
      ) &&
      trimmed.includes(
        "message"
      )
    ) {
      return false;
    }

    return true;
  };

export const getSafeErrorMessage =
  (
    error,
    fallback =
      "Something went wrong. Please try again."
  ) => {
    if (
      typeof error ===
      "string"
    ) {
      return isSafeUserMessage(
        error
      )
        ? error.trim()
        : fallback;
    }

    if (!error) {
      return fallback;
    }

    const apiMessage =
      error.response?.data
        ?.message;

    if (
      isSafeUserMessage(
        apiMessage
      )
    ) {
      return apiMessage.trim();
    }

    const status =
      error.response?.status;

    if (
      status &&
      statusMessages[status]
    ) {
      return statusMessages[status];
    }

    if (
      error.code ===
        "ERR_NETWORK" ||
      error.message ===
        "Network Error"
    ) {
      return "Could not reach the server. Check your connection and try again.";
    }

    if (
      isSafeUserMessage(
        error.message
      )
    ) {
      return error.message.trim();
    }

    return fallback;
  };

export const notify = {
  success: (message) => {
    if (!message) {
      return;
    }

    toast.success(message);
  },

  error: (
    error,
    fallback
  ) => {
    toast.error(
      getSafeErrorMessage(
        error,
        fallback
      )
    );
  },

  warning: (message) => {
    if (!message) {
      return;
    }

    toast(message, {
      icon: "⚠️",
    });
  },
};
