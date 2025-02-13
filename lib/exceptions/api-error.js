module.exports = class ApiError extends Error {
  status;
  code;
  error;

  constructor(status, message, code, error = '') {
    super(message);
    this.status = status;
    this.code = code;
    this.error = error;
  }

  static BadRequestError(message, error = '') {
    return new ApiError(400, message, error)
  }

  static InvalidEmailError() {
    return new ApiError(400, 'Invalid email', 'INVALID_EMAIL');
  }

  static InvalidPasswordError() {
    return new ApiError(400, 'Invalid password', 'INVALID_PASSWORD');
  }

  static InvalidCredentialsError() {
    return new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }
  
  static UnauthorizedError() {
    return new ApiError(401, 'User is not authorized', 'UNAUTHORIZED');
  }

  static InvalidRefreshTokenError() {
    return new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  static EmailNotActivatedError() {
    return new ApiError(403, 'Email is not activated', 'EMAIL_NOT_ACTIVATED');
  }

  static ActivationLinkNotFoundError() {
    return new ApiError(404, 'Activation link not found', 'ACTIVATION_LINK_NOT_FOUND');
  }

  static EmailExistsError() {
    return new ApiError(409, 'User with this email already exists', 'EMAIL_EXISTS');
  }

  static UserAlreadyActivatedError() {
    return new ApiError(409, 'User is already activated', 'USER_ALREADY_ACTIVATED');
  }

  static TooManyResendsError() {
    return new ApiError(429, 'Too many mail activation link sends', 'TOO_MANY_RESENDS');
  }

  static UnknownError(message = 'An unknown error occurred', error = '') {
    return new ApiError(500, message, 'UNKNOWN_ERROR', error);
  }
}
