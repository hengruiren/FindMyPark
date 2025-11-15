/**
 * Review routes
 */
const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/reviewController");

// Create review (requires authentication middleware)
router.post("/", ReviewController.createReview);

// Get park reviews (must be before /:reviewId)
router.get("/park/:parkId", ReviewController.getParkReviews);

// Get facility reviews (must be before /:reviewId)
router.get("/facility/:facilityId", ReviewController.getFacilityReviews);

// Get user reviews (must be before /:reviewId)
router.get("/user/:username", ReviewController.getUserReviews);

// Get review by ID (must be after specific routes)
router.get("/:reviewId", ReviewController.getReviewById);

// Update review (requires authentication middleware)
router.put("/:reviewId", ReviewController.updateReview);

// Delete review (requires authentication middleware)
router.delete("/:reviewId", ReviewController.deleteReview);

module.exports = router;

