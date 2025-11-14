/**
 * Facility routes
 */
const express = require("express");
const router = express.Router();
const FacilityController = require("../controllers/facilityController");

// Get all facility types
router.get("/types", FacilityController.getTypes);

// Get statistics
router.get("/stats", FacilityController.getStats);

// Get facility by ID
router.get("/:facilityId", FacilityController.getFacilityById);

// Search facilities
router.get("/", FacilityController.searchFacilities);

module.exports = router;
