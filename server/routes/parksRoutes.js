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

// Get park by ID
router.get("/:parkId", ParkController.getParkById);

// Search parks
router.get("/", ParkController.searchParks);

module.exports = router;

