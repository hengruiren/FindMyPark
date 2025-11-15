/**
 * Review model - Sequelize ORM
 */
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

const Review = sequelize.define(
  "Review",
  {
    review_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "user_id",
      },
    },
    park_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: "Park",
        key: "park_id",
      },
    },
    facility_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Facility",
        key: "facility_id",
      },
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      validate: {
        min: 0,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    create_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    last_update_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Review",
    timestamps: true,
    createdAt: "create_time",
    updatedAt: "last_update_time",
  }
);

module.exports = Review;
