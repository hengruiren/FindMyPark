/**
 * Review routes
 */
const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/reviewController");

// Create review (requires authentication middleware)
router.post("/", ReviewController.createReview);

// Get review by ID
router.get("/:reviewId", ReviewController.getReviewById);

// Update review (requires authentication middleware)
router.put("/:reviewId", ReviewController.updateReview);

// Delete review (requires authentication middleware)
router.delete("/:reviewId", ReviewController.deleteReview);

// Get park reviews
router.get("/park/:parkId", ReviewController.getParkReviews);

// Get facility reviews
router.get("/facility/:facilityId", ReviewController.getFacilityReviews);

// Get user reviews
router.get("/user/:userId", ReviewController.getUserReviews);

module.exports = router;

