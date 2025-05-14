module.exports = function (req, res, next) {
  const allowedOrigins = process.env.ALLOWED_CLIENTS.split(",");
  const origin = req.get("origin") || req.get("referer");

  if (req.path.startsWith("/api/activate")) {
    return next();
  }

  if (!origin || !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};
