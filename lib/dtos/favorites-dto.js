module.exports = class FavoritesDto {
  favorites;

  constructor(model) {
    this.id = model._id;
    this.favorites = model.favorites;
  }
}
