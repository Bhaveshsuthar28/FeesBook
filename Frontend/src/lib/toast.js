import React from "react";
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

    toast.success((t) =>
      React.createElement(
        "div",
        { className: "flex items-center justify-between gap-3 w-full" },
        React.createElement("span", null, message),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => toast.dismiss(t.id),
            className: "ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-emerald-800 hover:bg-emerald-200/50 focus:outline-none focus:ring-1 focus:ring-emerald-300",
            style: { border: "none", background: "transparent", cursor: "pointer", fontSize: "12px" },
          },
          "✕"
        )
      )
    );
  },

  error: (
    error,
    fallback
  ) => {
    const message = getSafeErrorMessage(error, fallback);
    toast.error((t) =>
      React.createElement(
        "div",
        { className: "flex items-center justify-between gap-3 w-full" },
        React.createElement("span", null, message),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => toast.dismiss(t.id),
            className: "ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-red-800 hover:bg-red-200/50 focus:outline-none focus:ring-1 focus:ring-red-300",
            style: { border: "none", background: "transparent", cursor: "pointer", fontSize: "12px" },
          },
          "✕"
        )
      )
    );
  },

  warning: (message) => {
    if (!message) {
      return;
    }

    toast(
      (t) =>
        React.createElement(
          "div",
          { className: "flex items-center justify-between gap-3 w-full" },
          React.createElement("span", null, message),
          React.createElement(
            "button",
            {
              type: "button",
              onClick: () => toast.dismiss(t.id),
              className: "ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-800 hover:bg-slate-200/50 focus:outline-none focus:ring-1 focus:ring-slate-300",
              style: { border: "none", background: "transparent", cursor: "pointer", fontSize: "12px" },
            },
            "✕"
          )
        ),
      {
        icon: "⚠️",
      }
    );
  },
};
