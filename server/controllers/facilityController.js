/**
 * Facility controller - Business logic layer
 */
const { Facility, Park } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

class FacilityController {
  // Get all facility types
  static async getTypes(req, res) {
    try {
      const types = await Facility.findAll({
        attributes: [
          [
            sequelize.fn("DISTINCT", sequelize.col("facility_type")),
            "facility_type",
          ],
        ],
        order: [["facility_type", "ASC"]],
        raw: true,
      });
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get statistics
  static async getStats(req, res) {
    try {
      const stats = await Facility.findAll({
        attributes: [
          "facility_type",
          [sequelize.fn("COUNT", sequelize.col("facility_id")), "count"],
          [
            sequelize.fn("AVG", sequelize.col("avg_facility_rating")),
            "avg_rating",
          ],
        ],
        group: ["facility_type"],
        order: [[sequelize.literal("count"), "DESC"]],
        raw: true,
      });
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get facility by ID
  static async getFacilityById(req, res) {
    try {
      const { facilityId } = req.params;
      const facility = await Facility.findByPk(facilityId, {
        include: [
          {
            model: Park,
            as: "Park",
            attributes: ["park_name", "borough", "latitude", "longitude"],
          },
        ],
      });

      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      res.json(facility);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Search facilities
  static async searchFacilities(req, res) {
    try {
      const {
        type,
        park_id,
        is_lighted,
        is_accessible,
        borough,
        limit = 50,
      } = req.query;

      let whereClause = {};
      let includeClause = [];

      if (park_id) {
        whereClause.park_id = park_id;
      }

      if (type) {
        whereClause.facility_type = type;
      }

      if (is_lighted !== undefined) {
        whereClause.is_lighted = is_lighted === "true";
      }

      if (is_accessible !== undefined) {
        whereClause.is_accessible = is_accessible === "true";
      }

      if (borough) {
        includeClause.push({
          model: Park,
          as: "Park",
          where: { borough },
          attributes: ["park_name", "borough", "latitude", "longitude"],
        });
      } else {
        includeClause.push({
          model: Park,
          as: "Park",
          attributes: ["park_name", "borough", "latitude", "longitude"],
        });
      }

      const facilities = await Facility.findAll({
        where: whereClause,
        include: includeClause,
        order: [["Park", "park_name", "ASC"]],
        limit: parseInt(limit),
      });

      res.json(facilities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = FacilityController;
