// Standardized API response formatter

export const successResponse = (message, data = null, statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    status: statusCode,
  };
};

export const errorResponse = (message, error = null, statusCode = 500) => {
  return {
    success: false,
    message,
    error: error || message,
    status: statusCode,
  };
};
