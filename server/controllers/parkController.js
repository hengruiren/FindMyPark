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

  // Search parks
  static async searchParks(req, res) {
    try {
      const {
        name,
        borough,
        latitude,
        longitude,
        radius,
        limit = 20,
      } = req.query;

      let parks;

      if (latitude && longitude) {
        // Nearby search using raw SQL for distance calculation
        const radiusKm = parseFloat(radius) || 5.0;
        parks = await sequelize.query(
          `
          SELECT *, 
            (6371 * acos(
              cos(radians(:lat)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(latitude))
            )) AS distance_km
          FROM Park
          HAVING distance_km <= :radius
          ORDER BY distance_km
          LIMIT :limit
        `,
          {
            replacements: {
              lat: parseFloat(latitude),
              lng: parseFloat(longitude),
              radius: radiusKm,
              limit: parseInt(limit),
            },
            type: sequelize.QueryTypes.SELECT,
          }
        );
      } else if (borough) {
        // Search by borough
        parks = await Park.findAll({
          where: { borough },
          order: [["park_name", "ASC"]],
          limit: parseInt(limit),
        });
      } else if (name) {
        // Search by name
        parks = await Park.findAll({
          where: {
            park_name: { [Op.like]: `%${name}%` },
          },
          order: [["park_name", "ASC"]],
          limit: parseInt(limit),
        });
      } else {
        // Default: return first 20
        parks = await Park.findAll({
          order: [["park_name", "ASC"]],
          limit: parseInt(limit),
        });
      }

      res.json(parks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ParkController;
