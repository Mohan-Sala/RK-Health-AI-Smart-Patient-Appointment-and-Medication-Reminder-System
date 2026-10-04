// Wrapper to catch async route errors and forward them to the global handler

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
