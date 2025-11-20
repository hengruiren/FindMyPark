/**
 * Park controller - Business logic layer
 */
const { Park, Facility, Trail, Review, User } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

class ParkController {
  // Get all boroughs
  static async getBoroughs(req, res) {
    try {
      const boroughs = await Park.findAll({
        attributes: [
          [sequelize.fn("DISTINCT", sequelize.col("borough")), "borough"],
        ],
        where: {
          borough: { [Op.ne]: null },
        },
        order: [["borough", "ASC"]],
        raw: true,
      });
      res.json(boroughs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all park types
  static async getParkTypes(req, res) {
    try {
      const parkTypes = await Park.findAll({
        attributes: [
          [sequelize.fn("DISTINCT", sequelize.col("park_type")), "park_type"],
        ],
        where: {
          park_type: { [Op.ne]: null },
        },
        order: [["park_type", "ASC"]],
        raw: true,
      });
      res.json(parkTypes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get statistics
  static async getStats(req, res) {
    try {
      const stats = await Park.findOne({
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("park_id")), "total_parks"],
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("borough"))
            ),
            "total_boroughs",
          ],
          [sequelize.fn("AVG", sequelize.col("avg_rating")), "avg_rating"],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal("CASE WHEN is_waterfront = 1 THEN 1 ELSE 0 END")
            ),
            "waterfront_parks",
          ],
        ],
        raw: true,
      });
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get park by ID
  static async getParkById(req, res) {
    try {
      const { parkId } = req.params;
      const includeDetails = req.query.details === "true";

      if (includeDetails) {
        // Get park with facilities, trails, and reviews
        const park = await Park.findByPk(parkId, {
          include: [
            {
              model: Facility,
              as: "Facilities",
            },
            {
              model: Trail,
              as: "Trails",
            },
            {
              model: Review,
              as: "Reviews",
              include: [
                {
                  model: User,
                  as: "User",
                  attributes: ["username"],
                },
              ],
              limit: 10,
              order: [["create_time", "DESC"]],
            },
          ],
        });

        if (!park) {
          return res.status(404).json({ error: "Park not found" });
        }

        res.json(park);
      } else {
        // Get basic park info only
        const park = await Park.findByPk(parkId);
        if (!park) {
          return res.status(404).json({ error: "Park not found" });
        }
        res.json(park);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Search parks by name and/or borough
  static async searchParks(req, res) {
    try {
      const { name, borough, limit = 20 } = req.query;

      const whereClause = {};

      if (name) {
        whereClause.park_name = name;
      }

      if (borough) {
        whereClause.borough = borough;
      }

      const parks = await Park.findAll({
        where: whereClause,
        order: [["park_name", "ASC"]],
        limit: parseInt(limit),
      });

      res.json(parks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get parks by facility type
  static async getParksByFacilityType(req, res) {
    try {
      const { facilityType, limit = 50 } = req.query;

      if (!facilityType) {
        return res
          .status(400)
          .json({ error: "facilityType parameter is required" });
      }

      // First get distinct park_ids that have this facility type
      const facilities = await Facility.findAll({
        where: { facility_type: facilityType },
        attributes: [
          [sequelize.fn("DISTINCT", sequelize.col("park_id")), "park_id"],
        ],
        raw: true,
      });

      const parkIds = facilities.map((f) => f.park_id);

      if (parkIds.length === 0) {
        return res.json([]);
      }

      // Then get the parks
      const parks = await Park.findAll({
        where: {
          park_id: { [Op.in]: parkIds },
        },
        order: [["park_name", "ASC"]],
        limit: parseInt(limit),
      });

      res.json(parks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ParkController;
