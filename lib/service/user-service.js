const UserModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const mailService = require('./mail-service');
const uuid = require('uuid');
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');
const favoritesService = require('./favorites-service');

async function updateRefreshToken(user) {
  const userDto = new UserDto(user);
  const tokens = await tokenService.generateTokens({...userDto});
  await tokenService.saveToken(userDto.id, tokens.refreshToken);
  
  return {...tokens, userDto};
}

class UserService {
  async registration(email, password) {
    const candidate = await UserModel.findOne({email});
    if (candidate) {
      throw ApiError.EmailExistsError();
    }
    const hashPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid.v4();
    const user = await UserModel.create({email, password: hashPassword, activationLink, nextResendAt: Date.now() + Number(process.env.RESEND_COOLDOWN)});
    await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);
    await favoritesService.createFavorites(user.id, []);

    return await updateRefreshToken(user);
  }

  async login(email, password) {
    const user = await UserModel.findOne({email});
    if (!user) {
      throw ApiError.InvalidCredentialsError();
    }
    const isPassEquals = await bcrypt.compare(password, user.password);
    if (!isPassEquals) {
      throw ApiError.InvalidCredentialsError();
    }

    return await updateRefreshToken(user);
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({activationLink});
    if (!user) {
      throw ApiError.ActivationLinkNotFoundError();
    }
    if (user.isActivated) {
      throw ApiError.UserAlreadyActivatedError();
    }
    user.isActivated = true;
    user.nextResendAt = undefined;
    await user.save();
  }

  async resend(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    const userData = await tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);
    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }
    const user = await UserModel.findById(userData.id);
    const { email, activationLink, isActivated, nextResendAt } = user;
    if (isActivated) {
      throw ApiError.UserAlreadyActivatedError();
    }
    if (nextResendAt && (Date.parse(nextResendAt) - Date.now()) > process.env.RESEND_COOLDOWN) {
      throw ApiError.TooManyResendsError();
    }

    await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);
    user.nextResendAt = Date.now() + Number(process.env.RESEND_COOLDOWN);
    await user.save();

    const userDto = new UserDto(user);
    return {userDto};
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.InvalidRefreshTokenError();
    }
    const userData = await tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);
    if (!userData || !tokenFromDb) {
      throw ApiError.InvalidRefreshTokenError();
    }
    const user = await UserModel.findById(userData.id);

    return await updateRefreshToken(user);
  }
}

module.exports = new UserService();
