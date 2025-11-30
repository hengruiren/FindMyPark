/**
 * AI Recommendations routes - OpenAI-powered intelligent recommendations
 */
const express = require("express");
const router = express.Router();
const AIRecommendationController = require("../controllers/aiRecommendationController");

// Get AI-powered personalized recommendations for a user
// Query params: 
//   - prompt (optional): specific user request like "parks good for running"
//   - limit (optional): number of recommendations (default 5)
router.get("/:username", AIRecommendationController.getAIRecommendations);

// Compare AI vs rule-based recommendations
router.get("/:username/compare", AIRecommendationController.compareRecommendations);

module.exports = router;


