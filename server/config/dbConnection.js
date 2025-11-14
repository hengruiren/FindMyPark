/**
 * Sequelize database connection
 */
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "findmypark_nyc",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "NewPassword123!",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✓ Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

module.exports = { sequelize, testConnection };
