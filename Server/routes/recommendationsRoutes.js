/**
 * Recommendations routes
 */
const express = require("express");
const router = express.Router();
const RecommendationController = require("../controllers/recommendationController");

// Get personalized recommendations for a user
router.get("/:username", RecommendationController.getRecommendations);

module.exports = router;

