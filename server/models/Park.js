/**
 * Park model - Sequelize ORM
 */
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

const Park = sequelize.define(
  "Park",
  {
    park_id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      comment: "GISPROPNUM from Parks Properties",
    },
    park_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    park_size: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    borough: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    zipcode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: "For map display",
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      comment: "For map display",
    },
    park_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    acres: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Park size for scoring",
    },
    is_waterfront: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    avg_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },
  },
  {
    tableName: "Park",
    timestamps: false,
  }
);

module.exports = Park;
