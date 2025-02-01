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

  static EmailNotActivatedError() {
    return new ApiError(403, 'Email is not activated', 'EMAIL_NOT_ACTIVATED');
  }

  static EmailExistsError() {
    return new ApiError(409, 'User with this email already exists', 'EMAIL_EXISTS');
  }

  static InvalidActivationLinkError() {
    return new ApiError(409, 'Activation link is invalid', 'INVALID_ACTIVATION_LINK');
  }

  static UnknownError(message = 'An unknown error occurred', error = '') {
    return new ApiError(500, message, 'UNKNOWN_ERROR', error);
  }
}
