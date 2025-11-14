/**
 * Trail model - Sequelize ORM
 */
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

const Trail = sequelize.define(
  "Trail",
  {
    trail_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    park_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    trail_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    width_ft: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    surface: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Paved, dirt, gravel, etc.",
    },
    difficulty: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    has_trail_markers: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    avg_trail_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    total_trail_reviews: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: "Trail",
    timestamps: false,
  }
);

module.exports = Trail;
