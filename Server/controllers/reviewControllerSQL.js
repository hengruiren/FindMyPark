/**
 * Review controller - Pure SQL Implementation (No ORM)
 * Implements CRUD operations using raw SQL queries
 */
const { pool, query, transaction } = require("../config/database");

class ReviewControllerSQL {
  // Create review using raw SQL with transaction
  static async createReview(req, res) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { user_id, park_id, facility_id, rating, comment } = req.body;

      // Validate required fields
      if (!user_id || (!park_id && !facility_id)) {
        await connection.rollback();
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (rating < 0 || rating > 5) {
        await connection.rollback();
        return res
          .status(400)
          .json({ error: "Rating must be between 0 and 5" });
      }

      // Validate user exists (subquery)
      const [userCheck] = await connection.execute(
        `SELECT user_id FROM User WHERE user_id = ?`,
        [user_id]
      );

      if (userCheck.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "User not found" });
      }

      // Validate park exists if provided (subquery)
      if (park_id) {
        const [parkCheck] = await connection.execute(
          `SELECT park_id FROM Park WHERE park_id = ?`,
          [park_id]
        );

        if (parkCheck.length === 0) {
          await connection.rollback();
          return res.status(404).json({ error: "Park not found" });
        }
      }

      // Validate facility exists if provided (subquery)
      if (facility_id) {
        const [facilityCheck] = await connection.execute(
          `SELECT facility_id FROM Facility WHERE facility_id = ?`,
          [facility_id]
        );

        if (facilityCheck.length === 0) {
          await connection.rollback();
          return res.status(404).json({ error: "Facility not found" });
        }
      }

      // Insert review using raw SQL
      const [result] = await connection.execute(
        `INSERT INTO Review (user_id, park_id, facility_id, rating, comment, create_time, last_update_time)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          user_id,
          park_id || null,
          facility_id || null,
          parseFloat(rating),
          comment || null,
        ]
      );

      // Note: Triggers will automatically update ratings
      // But we can also explicitly call stored procedure if needed

      await connection.commit();
      
      res.status(201).json({
        review_id: result.insertId,
        message: "Review created successfully",
      });
    } catch (error) {
      await connection.rollback();
      console.error("Error creating review:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  // Get review by ID using raw SQL with JOIN
  static async getReviewById(req, res) {
    try {
      const { reviewId } = req.params;

      // Advanced query: JOIN multiple relations
      const [reviews] = await pool.execute(
        `SELECT 
            r.review_id,
            r.user_id,
            r.park_id,
            r.facility_id,
            r.rating,
            r.comment,
            r.create_time,
            r.last_update_time,
            u.username,
            p.park_name,
            f.facility_type
         FROM Review r
         LEFT JOIN User u ON r.user_id = u.user_id
         LEFT JOIN Park p ON r.park_id = p.park_id
         LEFT JOIN Facility f ON r.facility_id = f.facility_id
         WHERE r.review_id = ?`,
        [reviewId]
      );

      if (reviews.length === 0) {
        return res.status(404).json({ error: "Review not found" });
      }

      res.json(reviews[0]);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get reviews by park_id using raw SQL with JOIN and GROUP BY
  static async getParkReviews(req, res) {
    try {
      const { parkId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      // Advanced query: JOIN with User, ORDER BY, LIMIT
      const [reviews] = await pool.execute(
        `SELECT 
            r.review_id,
            r.user_id,
            r.park_id,
            r.facility_id,
            r.rating,
            r.comment,
            r.create_time,
            r.last_update_time,
            u.username,
            p.park_name,
            f.facility_type,
            -- Aggregation using GROUP BY (review statistics)
            (SELECT COUNT(*) FROM Review r2 WHERE r2.user_id = r.user_id) AS user_total_reviews,
            (SELECT AVG(rating) FROM Review r3 WHERE r3.user_id = r.user_id) AS user_avg_rating
         FROM Review r
         JOIN User u ON r.user_id = u.user_id
         LEFT JOIN Park p ON r.park_id = p.park_id
         LEFT JOIN Facility f ON r.facility_id = f.facility_id
         WHERE r.park_id = ?
         ORDER BY r.create_time DESC
         LIMIT ?`,
        [parkId, limit]
      );

      res.json(reviews);
    } catch (error) {
      console.error("Error fetching park reviews:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update review using raw SQL with transaction
  static async updateReview(req, res) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const { reviewId } = req.params;
      const { rating, comment } = req.body;

      // Check if review exists
      const [existing] = await connection.execute(
        `SELECT review_id, park_id, facility_id FROM Review WHERE review_id = ?`,
        [reviewId]
      );

      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Review not found" });
      }

      if (rating !== undefined && (rating < 0 || rating > 5)) {
        await connection.rollback();
        return res
          .status(400)
          .json({ error: "Rating must be between 0 and 5" });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (rating !== undefined) {
        updates.push("rating = ?");
        values.push(parseFloat(rating));
      }

      if (comment !== undefined) {
        updates.push("comment = ?");
        values.push(comment);
      }

      if (updates.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "No fields to update" });
      }

      updates.push("last_update_time = NOW()");
      values.push(reviewId);

      // Update review using raw SQL
      const [result] = await connection.execute(
        `UPDATE Review SET ${updates.join(", ")} WHERE review_id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Review not found" });
      }

      // Note: Triggers will automatically update ratings
      
      await connection.commit();
      
      res.json({ message: "Review updated successfully" });
    } catch (error) {
      await connection.rollback();
      console.error("Error updating review:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  // Delete review using raw SQL with transaction
  static async deleteReview(req, res) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const { reviewId } = req.params;

      // Get review info before deletion (for rating updates)
      const [review] = await connection.execute(
        `SELECT review_id, park_id, facility_id FROM Review WHERE review_id = ?`,
        [reviewId]
      );

      if (review.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Review not found" });
      }

      // Delete review using raw SQL
      const [result] = await connection.execute(
        `DELETE FROM Review WHERE review_id = ?`,
        [reviewId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Review not found" });
      }

      // Note: Triggers will automatically update ratings
      
      await connection.commit();
      
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      await connection.rollback();
      console.error("Error deleting review:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  // Advanced query: Get review statistics by park using JOIN, GROUP BY, Aggregation
  static async getReviewStatistics(req, res) {
    try {
      const { parkId } = req.params;

      // Advanced query: Multiple JOINs, GROUP BY, Aggregation, Subqueries
      const [stats] = await pool.execute(
        `SELECT 
            p.park_id,
            p.park_name,
            COUNT(DISTINCT r.review_id) AS total_reviews,
            COUNT(DISTINCT r.user_id) AS unique_reviewers,
            ROUND(AVG(r.rating), 2) AS avg_rating,
            ROUND(MIN(r.rating), 2) AS min_rating,
            ROUND(MAX(r.rating), 2) AS max_rating,
            -- Subquery: count of 5-star reviews
            (SELECT COUNT(*) 
             FROM Review r5 
             WHERE r5.park_id = p.park_id AND r5.rating = 5) AS five_star_count,
            -- Subquery: count of facilities with reviews
            (SELECT COUNT(DISTINCT facility_id) 
             FROM Review rf 
             WHERE rf.park_id = p.park_id AND rf.facility_id IS NOT NULL) AS facilities_reviewed
         FROM Park p
         LEFT JOIN Review r ON p.park_id = r.park_id
         WHERE p.park_id = ?
         GROUP BY p.park_id, p.park_name`,
        [parkId]
      );

      if (stats.length === 0) {
        return res.status(404).json({ error: "Park not found" });
      }

      res.json(stats[0]);
    } catch (error) {
      console.error("Error fetching review statistics:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Advanced transaction: Batch create reviews with validation
  // Uses: Transaction, JOIN, Subqueries
  static async batchCreateReviews(req, res) {
    const connection = await pool.getConnection();
    
    try {
      // Set isolation level
      await connection.execute("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
      await connection.beginTransaction();

      const { reviews } = req.body; // Array of reviews

      if (!Array.isArray(reviews) || reviews.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Reviews array is required" });
      }

      const results = [];
      const errors = [];

      for (const reviewData of reviews) {
        try {
          const { user_id, park_id, facility_id, rating, comment } = reviewData;

          // Validate using subqueries
          const [userCheck] = await connection.execute(
            `SELECT user_id FROM User WHERE user_id = ?`,
            [user_id]
          );

          if (userCheck.length === 0) {
            errors.push({ review: reviewData, error: "User not found" });
            continue;
          }

          if (park_id) {
            const [parkCheck] = await connection.execute(
              `SELECT park_id FROM Park WHERE park_id = ?`,
              [park_id]
            );

            if (parkCheck.length === 0) {
              errors.push({ review: reviewData, error: "Park not found" });
              continue;
            }
          }

          // Insert review
          const [result] = await connection.execute(
            `INSERT INTO Review (user_id, park_id, facility_id, rating, comment, create_time, last_update_time)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              user_id,
              park_id || null,
              facility_id || null,
              parseFloat(rating),
              comment || null,
            ]
          );

          results.push({ review_id: result.insertId, ...reviewData });
        } catch (error) {
          errors.push({ review: reviewData, error: error.message });
        }
      }

      // Commit or rollback based on results
      if (errors.length === 0 || results.length > 0) {
        await connection.commit();
        
        res.status(201).json({
          created: results,
          errors: errors.length > 0 ? errors : undefined,
          message: `Successfully created ${results.length} review(s)`,
        });
      } else {
        await connection.rollback();
        res.status(400).json({
          error: "All reviews failed validation",
          errors: errors,
        });
      }
    } catch (error) {
      await connection.rollback();
      console.error("Error in batch create reviews:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }
}

module.exports = ReviewControllerSQL;

