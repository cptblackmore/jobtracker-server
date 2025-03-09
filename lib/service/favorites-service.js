const FavoritesDto = require('../dtos/favorites-dto');
const ApiError = require('../exceptions/api-error');
const FavoritesModel = require('../models/favorites-model');

class FavoritesService {
  async getFavorites(userId) {
    const favoritesData = await FavoritesModel.findOne({user: userId});
    if (!favoritesData) {
      throw ApiError.BadRequest('Favorites not found');
    }
    const favoritesDto = new FavoritesDto(favoritesData);
    return favoritesDto;
  }

  async synchronizeFavorites(userId, clientFavorites) {
    let favoritesData = await FavoritesModel.findOne({user: userId});
    if (!favoritesData) {
      return this.createFavorites(userId, clientFavorites);
    }
    const synchonizedFavorites = new Set([...favoritesData.favorites, ...clientFavorites]);
    favoritesData.favorites = Array.from(synchonizedFavorites);
    try {
      await favoritesData.save();
    } catch (e) {
      if (e.name === 'VersionError') {
        favoritesData = await FavoritesModel.findOne({user: userId});
      } else {
        throw e;
      }
    }
    const favoritesDto = new FavoritesDto(favoritesData);
    return favoritesDto;
  }

  async updateFavorites(userId, clientFavorites) {
    const favoritesData = await FavoritesModel.findOne({user: userId});
    if (!favoritesData) {
      return this.createFavorites(userId, clientFavorites);
    }
    favoritesData.favorites = clientFavorites;
    await favoritesData.save();
    const favoritesDto = new FavoritesDto(favoritesData);
    return favoritesDto;
  }

  async createFavorites(userId, clientFavorites) {
    const favoritesData = await FavoritesModel.create({user: userId, favorites: clientFavorites});
    return favoritesData;
  }
}

module.exports = new FavoritesService();
