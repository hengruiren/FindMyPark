/**
 * Trail routes
 */
const express = require("express");
const router = express.Router();
const TrailController = require("../controllers/trailController");

// Get all difficulty levels
router.get("/difficulties", TrailController.getDifficulties);

// Get statistics
router.get("/stats", TrailController.getStats);

// Get trail by ID
router.get("/:trailId", TrailController.getTrailById);

// Search trails
router.get("/", TrailController.searchTrails);

module.exports = router;

