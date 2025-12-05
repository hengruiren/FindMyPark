/**
 * AI Recommendation Controller - GPT-powered intelligent recommendations
 * Uses OpenAI API to provide natural language recommendations
 */
const { Park, Facility, Trail, Review, User } = require("../models");
const { Op } = require("sequelize");

class AIRecommendationController {
  /**
   * Get AI-powered recommendations using OpenAI API
   * This runs parallel to the rule-based recommendation system
   */
  static async getAIRecommendations(req, res) {
    try {
      const { username } = req.params;
      const { prompt, limit = 5 } = req.query;

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API key not configured",
          message: "Please set OPENAI_API_KEY in your .env file",
          setupInstructions: "Visit https://platform.openai.com/api-keys to get your API key"
        });
      }

      // Get user and preferences
      const user = await User.findOne({
        where: { username },
        attributes: ['user_id', 'username', 'preferences', 'favorites'],
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Parse user preferences
      let preferences = user.preferences;
      if (typeof preferences === 'string') {
        try {
          preferences = JSON.parse(preferences);
        } catch (e) {
          preferences = {};
        }
      }

      // Get user's favorite parks
      let favorites = user.favorites;
      if (typeof favorites === 'string') {
        try {
          favorites = JSON.parse(favorites);
        } catch (e) {
          favorites = [];
        }
      }

      // Fetch all parks with their facilities and trails
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
        limit: 50, // Limit to reduce API token usage
        order: [['avg_rating', 'DESC']], // Prioritize highly rated parks
      });

      // Build context about available parks
      const parkContext = AIRecommendationController.buildParkContext(
        parks,
        preferences,
        favorites
      );

      // Check if user provided a custom prompt
      const hasUserPrompt = prompt && prompt.trim().length > 0;

      // Construct prompt for OpenAI
      const systemPrompt = AIRecommendationController.buildSystemPrompt(hasUserPrompt);
      const userPrompt = AIRecommendationController.buildUserPrompt(
        username,
        preferences,
        favorites,
        parkContext,
        prompt,
        limit,
        hasUserPrompt
      );

      // Call OpenAI API
      const aiResponse = await AIRecommendationController.callOpenAI(
        systemPrompt,
        userPrompt
      );

      // Parse AI response and match with actual parks
      const recommendations = AIRecommendationController.parseAIResponse(
        aiResponse,
        parks
      );

      // Fetch detailed information for recommended parks
      const detailedRecommendations = await AIRecommendationController.getDetailedParkInfo(
        recommendations
      );

      res.json({
        type: 'ai',
        recommendations: detailedRecommendations,
        aiExplanation: aiResponse.explanation || "AI-powered personalized recommendations",
        rawAIResponse: aiResponse,
        userPrompt: prompt || "General recommendations based on your preferences",
      });

    } catch (error) {
      console.error('AI Recommendation Error:', error);
      res.status(500).json({
        error: error.message,
        type: 'ai_error',
        fallbackMessage: 'Please try the standard recommendation system'
      });
    }
  }

  /**
   * Build context about available parks for AI
   */
  static buildParkContext(parks, preferences, favorites) {
    return parks.slice(0, 30).map(park => { // Limit to top 30 to reduce tokens
      const parkData = park.toJSON();
      const facilities = (parkData.Facilities || []).map(f => f.facility_type);
      const trails = (parkData.Trails || []).length;
      const isFavorite = favorites.includes(parkData.park_id);

      return {
        id: parkData.park_id,
        name: parkData.park_name,
        borough: parkData.borough,
        type: parkData.park_type,
        rating: parseFloat(parkData.avg_rating) || 0,
        size: parseFloat(parkData.acres) || 0,
        waterfront: parkData.is_waterfront,
        latitude: parseFloat(parkData.latitude) || 0,
        longitude: parseFloat(parkData.longitude) || 0,
        facilities: [...new Set(facilities)].slice(0, 10), // Unique facilities
        trailCount: trails,
        isFavorite: isFavorite,
      };
    });
  }

  /**
   * Build system prompt for AI
   */
  static buildSystemPrompt(hasUserPrompt = false) {
    const promptPriority = hasUserPrompt 
      ? `CRITICAL: The user has provided a specific request. You MUST prioritize the user's current request over their saved preferences. 
If the user mentions a location (e.g., "I'm in Manhattan"), recommend parks in that location even if their saved preferences say otherwise.
If the user mentions specific needs (e.g., "good for running"), focus on those needs even if they differ from saved preferences.
IMPORTANT: If user says "near [Park Name]" or "close to [Park Name]", recommend OTHER parks nearby, NOT the park itself.
Only use saved preferences as a secondary reference if the user's request doesn't specify something.`
      : `Use the user's saved preferences as the primary guide for recommendations.`;

    const preferencesNote = hasUserPrompt 
      ? 'use as REFERENCE ONLY if user request does not specify'
      : 'use as PRIMARY guide';

    return `You are an expert park recommendation assistant for New York City parks. 
Your job is to recommend parks based on user preferences and requests.

You will be given:
1. User's saved preferences (favorite facilities, preferred boroughs, etc.) - ${preferencesNote}
2. List of their favorite parks
3. Available parks with details
4. User's specific request (if any)

${promptPriority}

IMPORTANT: You MUST respond with ONLY a valid JSON object in this exact format:
{
  "explanation": "A friendly 2-3 sentence explanation of why you're recommending these parks",
  "recommendations": [
    {
      "park_id": "exact_park_id_from_list",
      "reason": "1-2 sentence explanation for this specific park",
      "matchScore": 95
    }
  ]
}

Rules:
- Recommend 3-5 parks maximum
- Use EXACT park_id values from the provided list
- matchScore should be 0-100 (higher = better match)
- Be concise and personalized
- Consider user preferences, ratings, facilities, and location
- If user has favorites, explain how recommendations relate to them

CRITICAL LOCATION RULES:
- If user says "near [Park Name]" or "close to [Park Name]" or "around [Park Name]", you MUST recommend parks NEARBY that park, NOT the park itself
- For example: "near Central Park" means recommend parks in Manhattan near Central Park, NOT Central Park itself
- Use the latitude/longitude coordinates to identify parks in the same area/borough
- If user says "in [Location]" (e.g., "in Manhattan"), recommend parks in that location
- If user says "at [Park Name]" or just "[Park Name]", you can recommend that specific park

Do NOT include any text outside the JSON object.`;
  }

  /**
   * Build user prompt with context
   */
  static buildUserPrompt(username, preferences, favorites, parkContext, userPrompt, limit, hasUserPrompt) {
    const prefsStr = preferences ? JSON.stringify(preferences, null, 2) : "No preferences set";
    const favsStr = favorites && favorites.length > 0 
      ? favorites.join(", ") 
      : "No favorites yet";

    // If user provided a custom prompt, de-emphasize saved preferences
    const preferencesNote = hasUserPrompt 
      ? `User's Saved Preferences (REFERENCE ONLY - prioritize user's current request below):
${prefsStr}

NOTE: The user's current request below takes PRIORITY over these saved preferences.`
      : `User Preferences:
${prefsStr}`;

    const userRequest = hasUserPrompt
      ? `User's Current Request (PRIORITY - use this over saved preferences):
"${userPrompt}"

IMPORTANT: Prioritize what the user is asking for NOW, not their saved preferences.`
      : `User Request: ${userPrompt || "Please recommend parks based on my preferences and the available options."}`;

    return `User: ${username}

${preferencesNote}

User's Favorite Parks: ${favsStr}

Available Parks (top 30):
${JSON.stringify(parkContext, null, 2)}

${userRequest}

Recommend up to ${limit} parks. Return ONLY the JSON object as specified.`;
  }

  /**
   * Call OpenAI API
   */
  static async callOpenAI(systemPrompt, userPrompt) {
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', // Can upgrade to gpt-4
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content.trim();

    // Parse JSON response
    try {
      // Remove markdown code blocks if present
      let jsonStr = aiContent;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      // Return a fallback structure
      return {
        explanation: aiContent,
        recommendations: []
      };
    }
  }

  /**
   * Parse AI response and validate park IDs
   */
  static parseAIResponse(aiResponse, parks) {
    const recommendations = aiResponse.recommendations || [];
    const parkMap = new Map(parks.map(p => [p.park_id, p]));

    return recommendations
      .filter(rec => parkMap.has(rec.park_id))
      .map(rec => ({
        ...rec,
        park: parkMap.get(rec.park_id),
      }));
  }

  /**
   * Get detailed park information with reviews
   */
  static async getDetailedParkInfo(recommendations) {
    const parkIds = recommendations.map(r => r.park_id);

    if (parkIds.length === 0) {
      return [];
    }

    const detailedParks = await Park.findAll({
      where: {
        park_id: { [Op.in]: parkIds }
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
          limit: 3,
          order: [["create_time", "DESC"]],
        },
      ],
    });

    // Merge with AI recommendations
    const parkMap = new Map(detailedParks.map(p => [p.park_id, p.toJSON()]));
    
    return recommendations.map(rec => ({
      ...parkMap.get(rec.park_id),
      aiReason: rec.reason,
      aiMatchScore: rec.matchScore,
    }));
  }

  /**
   * Compare AI recommendations with rule-based recommendations
   */
  static async compareRecommendations(req, res) {
    try {
      const { username } = req.params;

      // Get both types of recommendations
      const RecommendationController = require('./recommendationController');
      
      // Mock request objects for internal calls
      const mockReq = { params: { username }, query: { limit: 5 } };
      
      let ruleBasedRecs = null;
      let aiRecs = null;

      // Get rule-based recommendations
      await new Promise((resolve) => {
        RecommendationController.getRecommendations(mockReq, {
          json: (data) => {
            ruleBasedRecs = data;
            resolve();
          },
          status: () => ({ json: resolve })
        });
      });

      // Get AI recommendations
      await AIRecommendationController.getAIRecommendations(mockReq, {
        json: (data) => {
          aiRecs = data;
        },
        status: () => ({ json: () => {} })
      });

      res.json({
        ruleBased: ruleBasedRecs,
        ai: aiRecs,
        comparison: {
          ruleBasedCount: ruleBasedRecs?.top10?.length || 0,
          aiCount: aiRecs?.recommendations?.length || 0,
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AIRecommendationController;


