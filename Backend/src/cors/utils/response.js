export const successResponse = ({
  message = "Success",
  data = null,
}) => {
  return {
    success: true,
    message,
    data,
  };
};

export const errorResponse = ({
  message = "Something went wrong",
}) => {
  return {
    success: false,
    message,
  };
};