module.exports = function (req, res, next) {
  const allowedTargets = process.env.ALLOWED_TARGETS.split(",");
  const targetUrl = req.headers["x-target-url"];
  if (!targetUrl) return res.status(403).json({ message: "Access denied" });

  try {
    const parsedUrl = new URL(targetUrl);
    const hostname = parsedUrl.hostname;

    if (!allowedTargets.includes(hostname)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch {
    return res.status(403).json({ message: "Access denied" });
  }
};
