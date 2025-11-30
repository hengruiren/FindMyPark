/**
 * Stored Procedure routes
 */
const express = require("express");
const router = express.Router();
const StoredProcedureController = require("../controllers/storedProcedureController");

// Call stored procedures
router.post("/update-park-rating/:park_id", StoredProcedureController.updateParkRating);
router.post("/update-facility-rating/:facility_id", StoredProcedureController.updateFacilityRating);
router.get("/park-statistics/:park_id", StoredProcedureController.getParkStatistics);
router.get("/top-rated-parks/:borough", StoredProcedureController.getTopRatedParksByBorough);

module.exports = router;



