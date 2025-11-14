/**
 * Models index - Define associations
 */
const User = require("./User");
const Park = require("./Park");
const Facility = require("./Facility");
const Trail = require("./Trail");
const Review = require("./Review");

// Define associations with aliases
Facility.belongsTo(Park, {
  foreignKey: "park_id",
  as: "Park",
  onDelete: "CASCADE",
});
Park.hasMany(Facility, { foreignKey: "park_id", as: "Facilities" });

Trail.belongsTo(Park, {
  foreignKey: "park_id",
  as: "Park",
  onDelete: "CASCADE",
});
Park.hasMany(Trail, { foreignKey: "park_id", as: "Trails" });

Review.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
  onDelete: "CASCADE",
});
User.hasMany(Review, { foreignKey: "user_id", as: "Reviews" });

Review.belongsTo(Park, {
  foreignKey: "park_id",
  as: "Park",
  onDelete: "CASCADE",
});
Park.hasMany(Review, { foreignKey: "park_id", as: "Reviews" });

Review.belongsTo(Facility, {
  foreignKey: "facility_id",
  as: "Facility",
  onDelete: "SET NULL",
});
Facility.hasMany(Review, { foreignKey: "facility_id", as: "Reviews" });

module.exports = {
  User,
  Park,
  Facility,
  Trail,
  Review,
};
