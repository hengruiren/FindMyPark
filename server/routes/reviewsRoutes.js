/**
 * Review routes
 */
const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/reviewController");
const ReviewControllerSQL = require("../controllers/reviewControllerSQL");

// Create review (requires authentication middleware)
router.post("/createReview", ReviewController.createReview);

// Get reviews by park_id or facility_id (with optional review_id) - must be before /:reviewId
router.get("/", ReviewController.getReviewByParkOrFacility);

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

// ============================================================
// Pure SQL CRUD Operations (No ORM)
// ============================================================
router.post("/sql/createReview", ReviewControllerSQL.createReview);
router.get("/sql/:reviewId", ReviewControllerSQL.getReviewById);
router.get("/sql/park/:parkId", ReviewControllerSQL.getParkReviews);
router.put("/sql/:reviewId", ReviewControllerSQL.updateReview);
router.delete("/sql/:reviewId", ReviewControllerSQL.deleteReview);
router.get("/sql/statistics/:parkId", ReviewControllerSQL.getReviewStatistics);
router.post("/sql/batch-create", ReviewControllerSQL.batchCreateReviews);

module.exports = router;
