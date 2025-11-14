/**
 * Facility model - Sequelize ORM
 */
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

const Facility = sequelize.define(
  "Facility",
  {
    facility_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    park_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    facility_type: {
      type: DataTypes.ENUM(
        "Basketball",
        "Tennis",
        "Soccer",
        "Baseball",
        "Softball",
        "Football",
        "Volleyball",
        "Track",
        "Handball",
        "Pickleball",
        "Hockey",
        "Cricket",
        "Rugby",
        "Bocce",
        "Lacrosse",
        "Frisbee",
        "Kickball",
        "Netball"
      ),
      allowNull: false,
    },
    dimensions: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    surface_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Natural grass, synthetic, asphalt, etc.",
    },
    is_lighted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    is_accessible: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "ADA accessible",
    },
    field_condition: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    avg_facility_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    total_facility_reviews: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: "Facility",
    timestamps: false,
  }
);

module.exports = Facility;
