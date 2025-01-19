const ApiError = require('../exceptions/api-error');
const FavoritesModel = require('../models/favorites-model');

class FavoritesService {
  async getFavorites(userId) {
    const favoritesData = await FavoritesModel.findOne({user: userId});
    if (!favoritesData) {
      throw ApiError.BadRequest('Favorites not found');
    }
    return favoritesData;
  }

  async synchronizeFavorites(userId, clientFavorites) {
    const favoritesData = await FavoritesModel.findOne({user: userId});
    if (!favoritesData) {
      return this.createFavorites(userId, clientFavorites);
    }
    const synchonizedFavorites = new Set([...favoritesData.favorites, ...clientFavorites]);
    favoritesData.favorites = Array.from(synchonizedFavorites);
    return favoritesData.save();
  }

  async updateFavorites(userId, clientFavorites) {
    const favoritesData = await FavoritesModel.findOne({user: userId});
    if (!favoritesData) {
      return this.createFavorites(userId, clientFavorites);
    }
    favoritesData.favorites = clientFavorites;
    return favoritesData.save();
  }

  async createFavorites(userId, clientFavorites) {
    const favoritesData = await FavoritesModel.create({user: userId, favorites: clientFavorites});
    return favoritesData;
  }
}

module.exports = new FavoritesService();
