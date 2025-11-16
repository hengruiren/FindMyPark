/**
 * Trail controller - Business logic layer
 */
const { Trail, Park } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

class TrailController {
  // Get all difficulty levels
  static async getDifficulties(req, res) {
    try {
      const difficulties = await Trail.findAll({
        attributes: [
          [sequelize.fn("DISTINCT", sequelize.col("difficulty")), "difficulty"],
        ],
        where: {
          difficulty: { [Op.ne]: null },
        },
        order: [["difficulty", "ASC"]],
        raw: true,
      });
      res.json(difficulties);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get statistics
  static async getStats(req, res) {
    try {
      const stats = await Trail.findAll({
        attributes: [
          "difficulty",
          [sequelize.fn("COUNT", sequelize.col("trail_id")), "count"],
          [
            sequelize.fn("AVG", sequelize.col("avg_trail_rating")),
            "avg_rating",
          ],
        ],
        where: {
          difficulty: { [Op.ne]: null },
        },
        group: ["difficulty"],
        order: [[sequelize.literal("count"), "DESC"]],
        raw: true,
      });
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get trail by ID
  static async getTrailById(req, res) {
    try {
      const { trailId } = req.params;
      const trail = await Trail.findByPk(trailId, {
        include: [
          {
            model: Park,
            as: "Park",
            attributes: ["park_name", "borough", "latitude", "longitude"],
          },
        ],
      });

      if (!trail) {
        return res.status(404).json({ error: "Trail not found" });
      }

      res.json(trail);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Search trails
  static async searchTrails(req, res) {
    try {
      const { park_id, difficulty, limit = 50 } = req.query;

      let whereClause = {};

      if (park_id) {
        whereClause.park_id = park_id;
      }

      if (difficulty) {
        // Match by first character of difficulty field (e.g., "1", "2", "3", "4")
        // This will match "1", "1 - Easy", "1. Easy", etc.
        const difficultyChar = String(difficulty).trim().charAt(0);
        whereClause.difficulty = {
          [Op.like]: `${difficultyChar}%`,
        };
      }

      const trails = await Trail.findAll({
        where: whereClause,
        include: [
          {
            model: Park,
            as: "Park",
            attributes: ["park_name", "borough", "latitude", "longitude"],
          },
        ],
        order: [["Park", "park_name", "ASC"]],
        limit: parseInt(limit),
      });

      res.json(trails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = TrailController;
