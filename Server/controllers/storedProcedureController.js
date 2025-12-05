/**
 * Stored Procedure Controller - Calls stored procedures from the database
 */
const { pool } = require("../config/database");

class StoredProcedureController {
  // Call UpdateParkRating stored procedure
  static async updateParkRating(req, res) {
    try {
      const { park_id } = req.params;

      const [result] = await pool.execute(
        `CALL UpdateParkRating(?)`,
        [park_id]
      );

      res.json({
        message: "Park rating updated successfully",
        park_id: park_id,
      });
    } catch (error) {
      console.error("Error calling UpdateParkRating:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Call UpdateFacilityRating stored procedure
  static async updateFacilityRating(req, res) {
    try {
      const { facility_id } = req.params;

      const [result] = await pool.execute(
        `CALL UpdateFacilityRating(?)`,
        [facility_id]
      );

      res.json({
        message: "Facility rating updated successfully",
        facility_id: facility_id,
      });
    } catch (error) {
      console.error("Error calling UpdateFacilityRating:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Call GetParkStatistics stored procedure
  static async getParkStatistics(req, res) {
    try {
      const { park_id } = req.params;

      const [results] = await pool.execute(
        `CALL GetParkStatistics(?)`,
        [park_id]
      );

      if (results[0].length === 0) {
        return res.status(404).json({ error: "Park not found" });
      }

      res.json(results[0][0]);
    } catch (error) {
      console.error("Error calling GetParkStatistics:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Call GetTopRatedParksByBorough stored procedure
  static async getTopRatedParksByBorough(req, res) {
    try {
      const { borough } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      const [results] = await pool.execute(
        `CALL GetTopRatedParksByBorough(?, ?)`,
        [borough, limit]
      );

      res.json(results[0]);
    } catch (error) {
      console.error("Error calling GetTopRatedParksByBorough:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = StoredProcedureController;



