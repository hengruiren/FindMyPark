/**
 * Park routes
 */
const express = require("express");
const router = express.Router();
const ParkController = require("../controllers/parkController");

// Get all boroughs
router.get("/boroughs", ParkController.getBoroughs);

// Get statistics
router.get("/stats", ParkController.getStats);

// Get parks by facility type (must be before /:parkId)
router.get("/by-facility", ParkController.getParksByFacilityType);

// Search parks (must be before /:parkId)
router.get("/", ParkController.searchParks);

// Get park by ID (must be after specific routes)
router.get("/:parkId", ParkController.getParkById);

module.exports = router;
