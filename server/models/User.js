/**
 * User model - Sequelize ORM
 */
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    preferences: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      get() {
        const rawValue = this.getDataValue('preferences');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('preferences', value ? JSON.stringify(value) : null);
      },
    },
  },
  {
    tableName: "User",
    timestamps: false,
  }
);

module.exports = User;
