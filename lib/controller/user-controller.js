const { validationResult } = require('express-validator');
const ApiError = require('../exceptions/api-error');
const userService = require('../service/user-service');
const favoritesService = require('../service/favorites-service');
const placesService = require('../service/places-service');

class UserController {
  async registration(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (errors.array().some(err => err.path === 'email')) throw ApiError.InvalidEmailError();
        if (errors.array().some(err => err.path === 'password')) throw ApiError.InvalidPasswordError();
      }
      const { email, password, favorites } = req.body;
      const userData = await userService.registration(email, password, favorites);
      res.cookie(
        'refreshToken', 
        userData.refreshToken, 
        {
          maxAge: 30 * 24 * 60 * 60 * 1000, 
          httpOnly: true, 
          secure: true, 
          sameSite: 'none',
          path: '/'
        }
      );
      return res.json({accessToken: userData.accessToken, userDto: userData.userDto});
    } catch (e) {
      next(e);
    }
  } 
  
  async login(req, res, next) {
    try {
      const { email, password, favorites } = req.body;
      const userData = await userService.login(email, password, favorites);
      res.cookie(
        'refreshToken', 
        userData.refreshToken, 
        {
          maxAge: 30 * 24 * 60 * 60 * 1000, 
          httpOnly: true, 
          secure: true, 
          sameSite: 'none',
          path: '/'
        }
      );
      return res.json({accessToken: userData.accessToken, userDto: userData.userDto});
    } catch (e) {
      next(e);
    }
  }
  
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      await userService.logout(refreshToken);
      res.clearCookie(
        'refreshToken',
        {
          httpOnly: true, 
          secure: true, 
          sameSite: 'none',
          path: '/',
          maxAge: 0
        }
      );
      return res.status(200).json({message: 'Logged out successfully'});
    } catch (e) {
      next(e);
    }
  }
  
  async activate(req, res, next) {
    try {
      const activationLink = req.params.link;
      await userService.activate(activationLink);
      return res.redirect(`${process.env.CLIENT_URL}/activation?code=ACTIVATION_SUCCESS`);
    } catch (e) {
      if (e.code) return res.redirect(`${process.env.CLIENT_URL}/activation?code=${e.code}`);
      next(e);
    }
  }

  async resend(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const userData = await userService.resend(refreshToken);
      return res.status(200).json(userData);
    } catch (e) {
      next(e);
    }
  }
  
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const userData = await userService.refresh(refreshToken);
      res.cookie(
        'refreshToken', 
        userData.refreshToken, 
        {
          maxAge: 30 * 24 * 60 * 60 * 1000, 
          httpOnly: true, 
          secure: true, 
          sameSite: 'none',
          path: '/'
        }
      );
      return res.json({accessToken: userData.accessToken, userDto: userData.userDto});
    } catch (e) {
      next(e);
    }
  }

  async refreshAck(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      await userService.refreshAck(refreshToken);
      return res.status(200).json({message: 'New refresh token saved successfully'});
    } catch (e) {
      next(e);
    }
  }

  async getUser(req, res, next) {
    try {
      const userId = req.user.id;
      const userData = await userService.getUser(userId);
      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }
  
  async getFavorites(req, res, next) {
    try {
      const userId = req.user.id;
      const favorites = await favoritesService.getFavorites(userId);
      return res.json(favorites);
    } catch (e) {
      next(e);
    }
  }

  async synchronizeFavorites(req, res, next) {
    try {
      const userId = req.user.id;
      const favorites = req.body.favorites;
      const synchronizedFavorites = await favoritesService.synchronizeFavorites(userId, favorites);
      return res.json(synchronizedFavorites);
    } catch (e) {
      next(e);
    }
  }

  async updateFavorites(req, res, next) {
    try {
      const userId = req.user.id;
      const favorites = req.body.favorites;
      const updatedFavorites = await favoritesService.updateFavorites(userId, favorites);
      return res.json(updatedFavorites);
    } catch (e) {
      next(e);
    }
  }

  async getPlaces(req, res, next) {
    try {
      const searchedPlaceQuery = req.query.place;
      const placesData = await placesService.getPlaces(searchedPlaceQuery);
      return res.json(placesData);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new UserController();
