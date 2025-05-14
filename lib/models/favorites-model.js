const { Schema, model } = require("mongoose");

const FavoritesSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  favorites: { type: Array, required: true },
});

module.exports = model("Favorites", FavoritesSchema);
