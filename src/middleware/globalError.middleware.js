const globalError = (err, req, res, next) => {
  const error = { ...err };
  const statusCode = err.statusCode || err.status || 500;
  try {
    return res.status(statusCode).json({
      statusCode: statusCode,
      errors: err.errors || [],
      message: err.message || "Server Error",
      success: err.success || false,
      data: err.data || null,
    });
  } catch (error) {
    next(error);
  }
};
