module.exports = class FavoritesDto {
  ud
  favorites;

  constructor(model) {
    this.id = model._id;
    this.favorites = model.favorites;
  }
}
