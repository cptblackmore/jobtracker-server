const UserModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const mailService = require('./mail-service');
const uuid = require('uuid');
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');

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
      throw ApiError.BadRequest(`User with e-mail ${email} already exists`);
    }
    const hashPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid.v4();
    const user = await UserModel.create({email, password: hashPassword, activationLink});
    await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

    return await updateRefreshToken(user);
  }

  async login(email, password) {
    const user = await UserModel.findOne({email});
    if (!user) {
      throw ApiError.BadRequest(`User with e-mail ${email} is not found`);
    }
    const isPassEquals = await bcrypt.compare(password, user.password);
    if (!isPassEquals) {
      throw ApiError.BadRequest('Invalid password');
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
      throw ApiError.BadRequest(`Invalid link: Link ${activationLink} is not found`);
    }
    user.isActivated = true;
    user.activationLink = undefined;
    await user.save();
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    const userData = await tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);
    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }
    const user = await UserModel.findById(userData.id);

    return await updateRefreshToken(user);
  }
}

module.exports = new UserService();
