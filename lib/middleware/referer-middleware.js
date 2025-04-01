module.exports = function (req, res, next) {
  const allowedOrigins = [process.env.CLIENT_URL];
  const origin = req.get('origin') || req.get('referer');

  if (!origin || !allowedOrigins.includes(origin)) {
      return res.status(403).json({message: 'Access denied'});
  }

  next();
}
