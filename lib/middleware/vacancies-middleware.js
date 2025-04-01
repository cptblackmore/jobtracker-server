const { createProxyMiddleware } = require('http-proxy-middleware');
const { rateLimit } = require('express-rate-limit');
const ApiError = require('../exceptions/api-error');
require('dotenv').config();

const vacanciesRateLimiter = rateLimit({
  windowMs: Number(process.env.VACANCIES_LIMIT_WINDOW) || 5 * 60 * 1000,
  max: Number(process.env.VACANCIES_LIMIT_MAX) || 200,
  handler: (req, res, next) => next(ApiError.TooManyVacanciesRequestsError())
});

module.exports = [
  vacanciesRateLimiter,
  createProxyMiddleware({
    changeOrigin: true,
    router: req => req.headers['x-target-url'],
    pathRewrite: (path) =>  path.replace(/^\/vacanciesProxy/, ''),
  })
]