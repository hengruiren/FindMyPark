-- ============================================================
-- STORED PROCEDURES
-- ============================================================

USE findmypark_nyc;

-- Procedure 1: Update Park Rating Statistics
-- This procedure updates the average rating and review count for a park
-- Uses: JOIN, GROUP BY, Subquery
DELIMITER $$

DROP PROCEDURE IF EXISTS UpdateParkRating$$
CREATE PROCEDURE UpdateParkRating(IN p_park_id VARCHAR(50))
BEGIN
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT NULL;
    DECLARE v_total_reviews INT DEFAULT 0;
    
    -- Calculate average rating using GROUP BY and aggregation
    SELECT 
        AVG(rating) AS avg_rating,
        COUNT(*) AS total_reviews
    INTO v_avg_rating, v_total_reviews
    FROM Review
    WHERE park_id = p_park_id 
        AND rating > 0
    GROUP BY park_id;
    
    -- Update park with calculated values (control structure: IF statement)
    IF v_avg_rating IS NOT NULL THEN
        UPDATE Park
        SET avg_rating = ROUND(v_avg_rating, 2)
        WHERE park_id = p_park_id;
    ELSE
        UPDATE Park
        SET avg_rating = NULL
        WHERE park_id = p_park_id;
    END IF;
END$$

-- Procedure 2: Update Facility Rating Statistics  
-- This procedure updates facility rating and review count
-- Uses: JOIN, GROUP BY, Subquery
DROP PROCEDURE IF EXISTS UpdateFacilityRating$$
CREATE PROCEDURE UpdateFacilityRating(IN p_facility_id INT)
BEGIN
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT NULL;
    DECLARE v_total_reviews INT DEFAULT 0;
    
    -- Calculate average rating and count using GROUP BY
    SELECT 
        AVG(rating) AS avg_rating,
        COUNT(*) AS total_reviews
    INTO v_avg_rating, v_total_reviews
    FROM Review
    WHERE facility_id = p_facility_id 
        AND rating > 0
    GROUP BY facility_id;
    
    -- Control structure: IF/ELSE
    IF v_avg_rating IS NOT NULL THEN
        UPDATE Facility
        SET avg_facility_rating = ROUND(v_avg_rating, 2),
            total_facility_reviews = v_total_reviews
        WHERE facility_id = p_facility_id;
    ELSE
        UPDATE Facility
        SET avg_facility_rating = 0.00,
            total_facility_reviews = 0
        WHERE facility_id = p_facility_id;
    END IF;
END$$

-- Procedure 3: Get Park Statistics with Facilities and Trails
-- Returns comprehensive statistics for a park
-- Uses: JOIN (multiple relations), GROUP BY, Aggregation
DROP PROCEDURE IF EXISTS GetParkStatistics$$
CREATE PROCEDURE GetParkStatistics(IN p_park_id VARCHAR(50))
BEGIN
    SELECT 
        p.park_id,
        p.park_name,
        p.borough,
        p.acres,
        p.avg_rating AS park_rating,
        p.is_waterfront,
        
        -- Facility statistics using JOIN and GROUP BY
        COUNT(DISTINCT f.facility_id) AS total_facilities,
        COUNT(DISTINCT f.facility_type) AS facility_types,
        GROUP_CONCAT(DISTINCT f.facility_type ORDER BY f.facility_type SEPARATOR ', ') AS facility_list,
        ROUND(AVG(f.avg_facility_rating), 2) AS avg_facility_rating,
        
        -- Trail statistics using JOIN
        COUNT(DISTINCT t.trail_id) AS total_trails,
        
        -- Review statistics
        (SELECT COUNT(*) FROM Review WHERE park_id = p_park_id) AS total_reviews,
        
        -- Advanced subquery: parks with more facilities than average
        CASE 
            WHEN COUNT(DISTINCT f.facility_id) > (
                SELECT AVG(facility_count)
                FROM (
                    SELECT COUNT(*) AS facility_count
                    FROM Facility
                    GROUP BY park_id
                ) AS subq
            ) THEN 'Above Average'
            ELSE 'Below Average'
        END AS facility_comparison
        
    FROM Park p
    LEFT JOIN Facility f ON p.park_id = f.park_id
    LEFT JOIN Trail t ON p.park_id = t.park_id
    WHERE p.park_id = p_park_id
    GROUP BY p.park_id, p.park_name, p.borough, p.acres, p.avg_rating, p.is_waterfront;
END$$

-- Procedure 4: Get Top Rated Parks by Borough with Detailed Stats
-- Uses: JOIN multiple relations, GROUP BY, Aggregation, Subqueries
DROP PROCEDURE IF EXISTS GetTopRatedParksByBorough$$
CREATE PROCEDURE GetTopRatedParksByBorough(
    IN p_borough VARCHAR(255),
    IN p_limit INT
)
BEGIN
    SELECT 
        p.park_id,
        p.park_name,
        p.borough,
        p.acres,
        p.avg_rating,
        p.is_waterfront,
        
        -- Facility statistics
        COUNT(DISTINCT f.facility_id) AS total_facilities,
        COUNT(DISTINCT f.facility_type) AS facility_types,
        ROUND(AVG(f.avg_facility_rating), 2) AS avg_facility_rating,
        
        -- Trail statistics
        COUNT(DISTINCT t.trail_id) AS total_trails,
        
        -- Review count (subquery)
        (SELECT COUNT(*) FROM Review WHERE park_id = p.park_id) AS review_count,
        
        -- Complex subquery: rank within borough
        (
            SELECT COUNT(*) + 1
            FROM Park p2
            WHERE p2.borough = p.borough 
                AND (p2.avg_rating > p.avg_rating 
                    OR (p2.avg_rating = p.avg_rating AND p2.park_id < p.park_id))
        ) AS borough_rank
        
    FROM Park p
    LEFT JOIN Facility f ON p.park_id = f.park_id
    LEFT JOIN Trail t ON p.park_id = t.park_id
    WHERE p.borough = p_borough
        AND p.avg_rating IS NOT NULL
    GROUP BY p.park_id, p.park_name, p.borough, p.acres, p.avg_rating, p.is_waterfront
    HAVING p.avg_rating >= (
        -- Subquery: average rating in borough
        SELECT AVG(avg_rating)
        FROM Park
        WHERE borough = p_borough 
            AND avg_rating IS NOT NULL
    )
    ORDER BY p.avg_rating DESC, total_facilities DESC
    LIMIT p_limit;
END$$

DELIMITER ;



