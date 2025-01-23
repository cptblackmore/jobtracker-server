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

  async synchronizeFavorites(userId, localFavorites) {
    const favoritesData = await FavoritesModel.findOne({user: userId});
    if (!favoritesData) {
      return this.createFavorites(userId, localFavorites);
    }
    const synchonizedFavorites = new Set([...favoritesData.favorites, ...localFavorites]);
    favoritesData.favorites = Array.from(synchonizedFavorites);
    await favoritesData.save();
    const favoritesDto = new FavoritesDto(favoritesData);
    return favoritesDto;
  }

  async updateFavorites(userId, localFavorites) {
    const favoritesData = await FavoritesModel.findOne({user: userId});
    if (!favoritesData) {
      return this.createFavorites(userId, localFavorites);
    }
    favoritesData.favorites = localFavorites;
    await favoritesData.save();
    const favoritesDto = new FavoritesDto(favoritesData);
    return favoritesDto;
  }

  async createFavorites(userId, localFavorites) {
    const favoritesData = await FavoritesModel.create({user: userId, favorites: localFavorites});
    return favoritesData;
  }
}

module.exports = new FavoritesService();
