export default function errorHandler(err, req, res, next) {
  console.error("Unhandled backend error:", err);

  return res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
}