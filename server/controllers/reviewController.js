/**
 * Review controller - Business logic layer
 */
const { Review, User, Park, Facility } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

class ReviewController {
  // Create review
  static async createReview(req, res) {
    try {
      const { user_id, park_id, facility_id, rating, comment } = req.body;

      // Validate required fields
      if (!user_id || (!park_id && !facility_id)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (rating < 0 || rating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be between 0 and 5" });
      }

      const review = await Review.create({
        user_id,
        park_id: park_id || null,
        facility_id: facility_id || null,
        rating: parseFloat(rating),
        comment: comment || null,
      });

      // Update related ratings
      if (park_id) {
        await this.updateParkRating(park_id);
      }
      if (facility_id) {
        await this.updateFacilityRating(facility_id);
      }

      res.status(201).json({
        review_id: review.review_id,
        message: "Review created successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get review by ID
  static async getReviewById(req, res) {
    try {
      const { reviewId } = req.params;
      const review = await Review.findByPk(reviewId, {
        include: [
          {
            model: User,
            as: "User",
            attributes: ["username"],
          },
          {
            model: Park,
            as: "Park",
            attributes: ["park_name"],
          },
        ],
      });

      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      res.json(review);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update review
  static async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { rating, comment } = req.body;

      if (rating !== undefined && (rating < 0 || rating > 5)) {
        return res
          .status(400)
          .json({ error: "Rating must be between 0 and 5" });
      }

      const updateData = {};
      if (rating !== undefined) updateData.rating = rating;
      if (comment !== undefined) updateData.comment = comment;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const [updated] = await Review.update(updateData, {
        where: { review_id: reviewId },
      });

      if (updated === 0) {
        return res.status(404).json({ error: "Review not found" });
      }

      // Get review to update related ratings
      const review = await Review.findByPk(reviewId);
      if (review) {
        if (review.park_id) {
          await this.updateParkRating(review.park_id);
        }
        if (review.facility_id) {
          await this.updateFacilityRating(review.facility_id);
        }
      }

      res.json({ message: "Review updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete review
  static async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;

      // Get review info to update ratings
      const review = await Review.findByPk(reviewId);

      const deleted = await Review.destroy({ where: { review_id: reviewId } });

      if (deleted === 0) {
        return res.status(404).json({ error: "Review not found" });
      }

      // Update related ratings
      if (review) {
        if (review.park_id) {
          await this.updateParkRating(review.park_id);
        }
        if (review.facility_id) {
          await this.updateFacilityRating(review.facility_id);
        }
      }

      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get park reviews
  static async getParkReviews(req, res) {
    try {
      const { parkId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const reviews = await Review.findAll({
        where: { park_id: parkId },
        include: [
          {
            model: User,
            as: "User",
            attributes: ["username"],
          },
        ],
        order: [["create_time", "DESC"]],
        limit,
      });
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get facility reviews
  static async getFacilityReviews(req, res) {
    try {
      const { facilityId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const reviews = await Review.findAll({
        where: { facility_id: facilityId },
        include: [
          {
            model: User,
            as: "User",
            attributes: ["username"],
          },
        ],
        order: [["create_time", "DESC"]],
        limit,
      });
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get user reviews
  static async getUserReviews(req, res) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const reviews = await Review.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Park,
            as: "Park",
            attributes: ["park_name"],
          },
          {
            model: Facility,
            as: "Facility",
            attributes: ["facility_type"],
          },
        ],
        order: [["create_time", "DESC"]],
        limit,
      });
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update park average rating
  static async updateParkRating(parkId) {
    await sequelize.query(
      `
      UPDATE Park 
      SET avg_rating = (
        SELECT AVG(rating) 
        FROM Review 
        WHERE park_id = :parkId AND rating > 0
      )
      WHERE park_id = :parkId
    `,
      {
        replacements: { parkId },
        type: sequelize.QueryTypes.UPDATE,
      }
    );
  }

  // Update facility average rating
  static async updateFacilityRating(facilityId) {
    await sequelize.query(
      `
      UPDATE Facility 
      SET avg_facility_rating = (
        SELECT AVG(rating) 
        FROM Review 
        WHERE facility_id = :facilityId AND rating > 0
      ),
      total_facility_reviews = (
        SELECT COUNT(*) 
        FROM Review 
        WHERE facility_id = :facilityId
      )
      WHERE facility_id = :facilityId
    `,
      {
        replacements: { facilityId },
        type: sequelize.QueryTypes.UPDATE,
      }
    );
  }
}

module.exports = ReviewController;
