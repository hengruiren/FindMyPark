/**
 * Recommendation controller - Business logic layer for park recommendations
 */
const { Park, Facility, Trail, Review, User } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

class RecommendationController {
  // Get personalized park recommendations for a user
  static async getRecommendations(req, res) {
    try {
      const { username } = req.params;
      const { limit = 10 } = req.query;

      // Get user and preferences
      const user = await User.findOne({
        where: { username },
        attributes: ['user_id', 'username', 'preferences'],
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = user.toJSON();
      let preferences = userData.preferences;
      
      // Parse preferences if it's a string
      if (typeof preferences === 'string') {
        try {
          preferences = JSON.parse(preferences);
        } catch (e) {
          preferences = null;
        }
      }

      // Default preferences if none exist
      if (!preferences) {
        preferences = {
          favoriteFacilities: [],
          preferredBoroughs: [],
          preferredParkTypes: [],
          preferredWaterfront: null, // null = no preference, true/false
          minRating: 0,
          preferredSize: null, // 'small', 'medium', 'large', null
          showOnlyFavorites: false
        };
      }

      // Ensure all preference fields exist
      const prefs = {
        favoriteFacilities: preferences.favoriteFacilities || [],
        preferredBoroughs: preferences.preferredBoroughs || [],
        preferredParkTypes: preferences.preferredParkTypes || [],
        preferredWaterfront: preferences.preferredWaterfront ?? null,
        minRating: preferences.minRating || 0,
        preferredSize: preferences.preferredSize || null,
      };

      // Get all parks with their facilities, trails, and reviews
      const parks = await Park.findAll({
        include: [
          {
            model: Facility,
            as: "Facilities",
            required: false,
          },
          {
            model: Trail,
            as: "Trails",
            required: false,
          },
        ],
      });

      // Calculate recommendation scores for each park
      const parkScores = parks.map(park => {
        const score = RecommendationController.calculateRecommendationScore(park.toJSON(), prefs);
        return {
          ...park.toJSON(),
          recommendationScore: score,
        };
      });

      // Filter parks by minimum rating if specified
      const filteredParks = parkScores.filter(park => {
        const rating = parseFloat(park.avg_rating) || 0;
        return rating >= prefs.minRating;
      });

      // Sort by recommendation score (descending)
      filteredParks.sort((a, b) => b.recommendationScore - a.recommendationScore);

      // Get top N parks
      const topParks = filteredParks.slice(0, parseInt(limit));

      // Get detailed info for top 3 parks
      const top3ParkIds = topParks.slice(0, 3).map(p => p.park_id);
      let detailedParks = [];
      
      if (top3ParkIds.length > 0) {
        detailedParks = await Park.findAll({
          where: {
            park_id: { [Op.in]: top3ParkIds }
          },
          include: [
            {
              model: Facility,
              as: "Facilities",
              required: false,
            },
            {
              model: Trail,
              as: "Trails",
              required: false,
            },
            {
              model: Review,
              as: "Reviews",
              include: [
                {
                  model: User,
                  as: "User",
                  attributes: ["username"],
                  required: false,
                },
              ],
              required: false,
              limit: 5,
              order: [["create_time", "DESC"]],
            },
          ],
        });
      }

      // Merge detailed info with scores and maintain order
      const parkScoreMap = new Map();
      topParks.forEach(p => {
        parkScoreMap.set(p.park_id, p.recommendationScore);
      });

      const detailedWithScores = detailedParks.map(park => {
        const parkJson = park.toJSON();
        return {
          ...parkJson,
          recommendationScore: parkScoreMap.get(parkJson.park_id) || 0,
        };
      });

      // Sort detailed parks by score (descending) to ensure correct order
      detailedWithScores.sort((a, b) => b.recommendationScore - a.recommendationScore);

      // Return top 3 detailed and top 10 simple
      res.json({
        top3: detailedWithScores.slice(0, 3),
        top10: topParks.map(p => ({
          park_id: p.park_id,
          park_name: p.park_name,
          borough: p.borough,
          latitude: p.latitude,
          longitude: p.longitude,
          avg_rating: p.avg_rating,
          recommendationScore: p.recommendationScore,
        })),
        preferences: prefs,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Calculate recommendation score for a park based on user preferences
  static calculateRecommendationScore(park, preferences) {
    let score = 0;
    const weights = {
      borough: 30,
      facility: 40,
      parkType: 15,
      waterfront: 10,
      rating: 20,
      size: 10,
    };

    // Borough match (30 points)
    if (preferences.preferredBoroughs && preferences.preferredBoroughs.length > 0) {
      if (preferences.preferredBoroughs.includes(park.borough)) {
        score += weights.borough;
      }
    } else {
      // If no borough preference, give base points
      score += weights.borough * 0.5;
    }

    // Facility match (40 points)
    if (preferences.favoriteFacilities && preferences.favoriteFacilities.length > 0) {
      const parkFacilityTypes = (park.Facilities || []).map(f => f.facility_type);
      const matchingFacilities = preferences.favoriteFacilities.filter(f =>
        parkFacilityTypes.includes(f)
      );
      
      if (matchingFacilities.length > 0) {
        // More matches = higher score
        const matchRatio = matchingFacilities.length / preferences.favoriteFacilities.length;
        score += weights.facility * Math.min(matchRatio, 1);
      }
    } else {
      // If no facility preference, give base points
      score += weights.facility * 0.3;
    }

    // Park type match (15 points)
    if (preferences.preferredParkTypes && preferences.preferredParkTypes.length > 0) {
      if (preferences.preferredParkTypes.includes(park.park_type)) {
        score += weights.parkType;
      }
    } else {
      score += weights.parkType * 0.5;
    }

    // Waterfront preference (10 points)
    if (preferences.preferredWaterfront !== null) {
      if (park.is_waterfront === preferences.preferredWaterfront) {
        score += weights.waterfront;
      }
    } else {
      score += weights.waterfront * 0.5;
    }

    // Rating score (20 points)
    const rating = parseFloat(park.avg_rating) || 0;
    if (rating > 0) {
      // Normalize rating (0-5) to 0-20 points
      score += (rating / 5) * weights.rating;
    } else {
      // If no rating, give base points
      score += weights.rating * 0.3;
    }

    // Size preference (10 points)
    if (preferences.preferredSize) {
      const acres = parseFloat(park.acres) || 0;
      let parkSizeCategory = 'medium';
      
      if (acres < 5) parkSizeCategory = 'small';
      else if (acres > 50) parkSizeCategory = 'large';
      
      if (parkSizeCategory === preferences.preferredSize) {
        score += weights.size;
      }
    } else {
      score += weights.size * 0.5;
    }

    // Bonus points for parks with more facilities
    const facilityCount = (park.Facilities || []).length;
    score += Math.min(facilityCount * 0.5, 5);

    // Bonus points for parks with trails
    const trailCount = (park.Trails || []).length;
    if (trailCount > 0) {
      score += 2;
    }

    // Ensure score is between 0 and 100 (normalize if needed)
    return Math.min(Math.max(score, 0), 100);
  }
}

module.exports = RecommendationController;

