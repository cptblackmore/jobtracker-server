const jwt = require('jsonwebtoken')
require('dotenv').config()
const TokenModel = require('../models/token-model');

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn: '30m'})
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: '30d'})
    return {
      accessToken,
      refreshToken
    }
  }

  async saveToken(userId, refreshToken) {
    const tokenData = await TokenModel.findOne({user: userId});
    if (tokenData) {
      tokenData.refreshToken = refreshToken;
      return tokenData.save();
    }
    const token = await TokenModel.create({user: userId, refreshToken});
    return token;
  }

  async savePendingToken(userId, refreshToken) {
    const tokenData = await TokenModel.findOne({user: userId});
    if (tokenData) {
      tokenData.pendingRefreshToken = refreshToken;
      return tokenData.save();
    }
    const token = await TokenModel.create({user: userId, refreshToken: null, pendingRefreshToken: refreshToken});
    return token;
  }

  async removeToken(refreshToken) {
    const tokenData = await TokenModel.findOneAndDelete({refreshToken});
    return tokenData;
  }

  validateAccessToken(accessToken) {
    try {
      const userData = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
      return userData;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  validateRefreshToken(refreshToken) {
    try {
      const userData = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      return userData;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async findToken(refreshToken) {
    const tokenData = await TokenModel.findOne({refreshToken});
    return tokenData;
  }

  async findPendingToken(pendingRefreshToken) {
    const tokenData = await TokenModel.findOne({pendingRefreshToken})
    return tokenData;
  }
}

module.exports = new TokenService();
