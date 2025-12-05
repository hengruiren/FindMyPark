# Smart Recommendations System - How It Works

## Table of Contents

1. [System Overview](#system-overview)
2. [Workflow](#workflow)
3. [Scoring Algorithm Details](#scoring-algorithm-details)
4. [Weight Distribution](#weight-distribution)
5. [Calculation Examples](#calculation-examples)
6. [User Preference Settings](#user-preference-settings)

---

## System Overview

The Smart Recommendations system is a **rule-based recommendation algorithm** that analyzes user preferences and park characteristics to calculate a recommendation score for each park, then ranks them from highest to lowest to recommend parks that best match user needs.

### Key Features

- ✅ **Preference-Based**: Recommendations based on user-configured preferences
- ✅ **Multi-Dimensional Scoring**: Considers multiple factors (location, facilities, type, rating, etc.)
- ✅ **Weighted Algorithm**: Different factors have different weights, with important factors weighted higher
- ✅ **Real-Time Calculation**: Calculated in real-time on each request to ensure the latest results

---

## Workflow

### Step 1: Get User Preferences

The system first retrieves user preference settings from the database:

```javascript
// User preference structure
{
  favoriteFacilities: ["Basketball", "Tennis", "Soccer"],
  preferredBoroughs: ["Manhattan", "Brooklyn"],
  preferredParkTypes: ["Flagship Park", "Community Park"],
  preferredWaterfront: true,
  minRating: 3.5,
  preferredSize: "large"
}
```

If the user hasn't set preferences, the system uses default values:
- All factors receive base scores
- No filtering is applied

### Step 2: Get All Park Data

The system queries the database for all parks and related information:
- Basic park information (name, location, type, etc.)
- Facility information (Facilities)
- Trail information (Trails)

### Step 3: Calculate Recommendation Scores

For each park, the system calls the `calculateRecommendationScore()` function to compute the recommendation score.

### Step 4: Filter and Sort

1. **Filter**: Filter parks based on the user's minimum rating (minRating)
2. **Sort**: Sort by recommendation score from highest to lowest
3. **Select**: Select the Top N parks (default Top 10)

### Step 5: Return Results

Returns:
- **Top 3**: Detailed information (including facilities, trails, reviews)
- **Top 10**: Brief information (for list display)

---

## Scoring Algorithm Details

The recommendation score is calculated using the following formula:

```
Total Score = Borough Match Score + Facility Match Score + Park Type Match Score 
            + Waterfront Preference Score + Rating Score + Size Preference Score 
            + Facility Count Bonus + Trail Bonus
```

### Score Range

- **Minimum Score**: 0 points
- **Maximum Score**: 100 points
- **Final Score**: Clamped between 0-100

---

## Weight Distribution

The system uses the following weight distribution (total 125 points, normalized to 100):

| Factor | Weight | Description |
|--------|--------|-------------|
| **Facility Match** | 40 points | Most important factor, what users care about most |
| **Borough Match** | 30 points | Location preference, users usually have clear preferences |
| **Rating** | 20 points | Important indicator of park quality |
| **Park Type** | 15 points | Users may prefer specific types |
| **Waterfront Preference** | 10 points | Bonus factor, not required |
| **Size Preference** | 10 points | Bonus factor, smaller impact |
| **Facility Count Bonus** | Up to 5 points | Extra bonus, more facilities is better |
| **Trail Bonus** | 2 points | Extra bonus, parks with trails get points |

---

## Detailed Calculation Rules

### 1. Borough Match - 30 points

**Rules**:
- If user has preferred boroughs set, and park is in that borough → **+30 points**
- If user has no borough preference → **+15 points** (base score)

**Example**:
- User preference: `["Manhattan", "Brooklyn"]`
- Central Park is in Manhattan → **+30 points**
- Queens Park is in Queens → **+0 points**

### 2. Facility Match - 40 points

**Rules**:
- Count matching facilities
- Score = `(Matching Facilities / User Preferred Facilities Total) × 40`
- If user has no facility preference → **+12 points** (base score)

**Example**:
- User preferred facilities: `["Basketball", "Tennis", "Soccer"]` (3 total)
- Park A has: `["Basketball", "Tennis"]` (2 matches)
  - Score = (2/3) × 40 = **26.7 points**
- Park B has: `["Basketball", "Tennis", "Soccer"]` (3 matches)
  - Score = (3/3) × 40 = **40 points** (full score)

### 3. Park Type Match - 15 points

**Rules**:
- If user has preferred types set, and park matches → **+15 points**
- If user has no type preference → **+7.5 points** (base score)

**Example**:
- User preference: `["Flagship Park"]`
- Central Park is a Flagship Park → **+15 points**
- Community Park → **+0 points**

### 4. Waterfront Preference - 10 points

**Rules**:
- If user has waterfront preference set (true/false), and park matches → **+10 points**
- If user has no preference → **+5 points** (base score)

**Example**:
- User preference: `preferredWaterfront: true`
- Park A is waterfront → **+10 points**
- Park B is not waterfront → **+0 points**

### 5. Rating Score - 20 points

**Rules**:
- Convert 0-5 rating to 0-20 points
- Formula: `(Park Rating / 5) × 20`
- If no rating → **+6 points** (base score)

**Example**:
- Park rating: 4.5 / 5.0
  - Score = (4.5/5) × 20 = **18 points**
- Park rating: 3.0 / 5.0
  - Score = (3.0/5) × 20 = **12 points**
- No rating
  - Score = **6 points**

### 6. Size Preference - 10 points

**Rules**:
- Categorize park size:
  - Small: < 5 acres
  - Medium: 5-50 acres
  - Large: > 50 acres
- If user has preferred size set, and it matches → **+10 points**
- If user has no size preference → **+5 points** (base score)

**Example**:
- User preference: `preferredSize: "large"`
- Park A: 100 acres (Large) → **+10 points**
- Park B: 10 acres (Medium) → **+0 points**

### 7. Facility Count Bonus - Up to 5 points

**Rules**:
- Formula: `Facility Count × 0.5`
- Maximum limit: 5 points

**Example**:
- Park A has 10 facilities → 10 × 0.5 = **5 points**
- Park B has 5 facilities → 5 × 0.5 = **2.5 points**
- Park C has 15 facilities → 15 × 0.5 = 7.5, but capped at **5 points**

### 8. Trail Bonus - 2 points

**Rules**:
- If park has trails (trailCount > 0) → **+2 points**
- If no trails → **+0 points**

**Example**:
- Park A has 50 trails → **+2 points**
- Park B has no trails → **+0 points**

---

## Calculation Examples

### Example 1: Perfect Match

**User Preferences**:
```json
{
  "favoriteFacilities": ["Basketball", "Tennis"],
  "preferredBoroughs": ["Manhattan"],
  "preferredParkTypes": ["Flagship Park"],
  "preferredWaterfront": true,
  "minRating": 4.0,
  "preferredSize": "large"
}
```

**Park Information**: Central Park
- Borough: Manhattan ✅
- Facilities: Basketball, Tennis, Soccer ✅
- Type: Flagship Park ✅
- Waterfront: true ✅
- Rating: 4.5 / 5.0
- Size: 840 acres (Large) ✅
- Facility Count: 22
- Trails: 277

**Calculation Process**:
```
Borough Match: 30 points (matches Manhattan)
Facility Match: (2/2) × 40 = 40 points (perfect match)
Type Match: 15 points (matches Flagship Park)
Waterfront Preference: 10 points (is waterfront)
Rating Score: (4.5/5) × 20 = 18 points
Size Preference: 10 points (Large)
Facility Bonus: 22 × 0.5 = 5 points (reached limit)
Trail Bonus: 2 points (has trails)

Total = 30 + 40 + 15 + 10 + 18 + 10 + 5 + 2 = 130 points
Final Score = min(130, 100) = 100 points ✅
```

### Example 2: Partial Match

**User Preferences**:
```json
{
  "favoriteFacilities": ["Basketball", "Tennis", "Soccer"],
  "preferredBoroughs": ["Brooklyn"],
  "preferredParkTypes": [],
  "preferredWaterfront": null,
  "minRating": 0,
  "preferredSize": null
}
```

**Park Information**: Prospect Park
- Borough: Brooklyn ✅
- Facilities: Basketball, Tennis (missing Soccer)
- Type: Flagship Park
- Waterfront: true
- Rating: 4.2 / 5.0
- Size: 526 acres
- Facility Count: 15
- Trails: 50

**Calculation Process**:
```
Borough Match: 30 points (matches Brooklyn)
Facility Match: (2/3) × 40 = 26.7 points (partial match)
Type Match: 7.5 points (user has no preference, base score)
Waterfront Preference: 5 points (user has no preference, base score)
Rating Score: (4.2/5) × 20 = 16.8 points
Size Preference: 5 points (user has no preference, base score)
Facility Bonus: 15 × 0.5 = 5 points (reached limit)
Trail Bonus: 2 points (has trails)

Total = 30 + 26.7 + 7.5 + 5 + 16.8 + 5 + 5 + 2 = 98 points
Final Score = 98 points
```

### Example 3: No Match

**User Preferences**:
```json
{
  "favoriteFacilities": ["Swimming Pool"],
  "preferredBoroughs": ["Manhattan"],
  "preferredParkTypes": [],
  "preferredWaterfront": false,
  "minRating": 0,
  "preferredSize": null
}
```

**Park Information**: A small park in Queens
- Borough: Queens ❌
- Facilities: Playground (no Swimming Pool) ❌
- Type: Community Park
- Waterfront: true ❌ (user prefers false)
- Rating: 2.5 / 5.0
- Size: 3 acres
- Facility Count: 2
- Trails: 0

**Calculation Process**:
```
Borough Match: 0 points (no match)
Facility Match: 0 points (no matching facilities)
Type Match: 7.5 points (user has no preference, base score)
Waterfront Preference: 0 points (doesn't match user preference)
Rating Score: (2.5/5) × 20 = 10 points
Size Preference: 5 points (user has no preference, base score)
Facility Bonus: 2 × 0.5 = 1 point
Trail Bonus: 0 points (no trails)

Total = 0 + 0 + 7.5 + 0 + 10 + 5 + 1 + 0 = 23.5 points
Final Score = 23.5 points (will rank very low)
```

---

## User Preference Settings

Users can configure the following preferences in the Settings page:

### 1. Favorite Facilities

- Select multiple facility types
- System prioritizes parks containing these facilities
- **Highest Weight**: 40 points

### 2. Preferred Boroughs

- Select multiple boroughs
- System prioritizes parks in these areas
- **High Weight**: 30 points

### 3. Preferred Park Types

- Select park types (e.g., Flagship Park, Community Park)
- **Medium Weight**: 15 points

### 4. Waterfront Preference

- Choose: Yes / No / No Preference
- **Low Weight**: 10 points

### 5. Minimum Rating

- Set the minimum acceptable rating
- Used for filtering, not included in score calculation
- Parks below this rating are directly excluded

### 6. Preferred Size

- Choose: Small / Medium / Large / No Preference
- **Low Weight**: 10 points

---

## Algorithm Characteristics

### Advantages

1. **Transparent and Explainable**: Each score has a clear source
2. **Customizable**: Users can influence recommendations through preference settings
3. **Real-Time Calculation**: Recalculated on each request to ensure latest results
4. **Multi-Dimensional**: Considers multiple factors, not overly dependent on a single factor

### Limitations

1. **Rule-Based**: Cannot understand complex user intentions
2. **Static Weights**: Weights are fixed, cannot adjust based on user behavior
3. **No Learning Capability**: Does not learn from user feedback to improve

---

## Code Location

The core code for the recommendation algorithm is located at:

```
Server/controllers/recommendationController.js
```

Main functions:
- `getRecommendations()` - Main function to get recommendations
- `calculateRecommendationScore()` - Core algorithm to calculate recommendation scores

---

## Summary

The Smart Recommendations system works as follows:

1. **Collect User Preferences** → Understand user needs
2. **Get Park Data** → Understand available options
3. **Calculate Match Scores** → Quantify how well each park matches
4. **Sort and Filter** → Select parks that best match needs
5. **Return Results** → Display to users

**Core Concept**: Through a weighted algorithm, convert user preferences into numerical scores, then sort by score to recommend the most matching parks.

---

## Usage Recommendations

### For Users

1. **Set Detailed Preferences**: More detailed preferences lead to more accurate recommendations
2. **Update Preferences Regularly**: Adjust preferences based on usage experience
3. **Review Recommendation Reasons**: Understand why a park was recommended

### For Developers

1. **Adjust Weights**: Can adjust weight distribution based on actual usage
2. **Add New Factors**: Can add new scoring factors (e.g., distance, opening hours)
3. **Optimize Algorithm**: Can improve the algorithm to make it smarter

---

**Document Version**: 1.0  
**Last Updated**: 2024-11-21  
**Maintained By**: Development Team



