USE findmypark_nyc;

-- Query 1: The park, facility number for each borough
SELECT '========================================' AS '';
SELECT 'Starting Query 1: Borough Statistics' AS '';
SELECT '========================================' AS '';
SELECT 
    p.borough,
    COUNT(DISTINCT p.park_id) AS total_parks,
    COUNT(f.facility_id) AS total_facilities,
    ROUND(AVG(p.avg_rating), 2) AS avg_park_rating
FROM Park p
LEFT JOIN Facility f ON p.park_id = f.park_id
WHERE p.borough IS NOT NULL
GROUP BY p.borough
ORDER BY total_parks DESC
LIMIT 15;

-- Query 2: TOP 15 parks with most basketball courts
SELECT '========================================' AS '';
SELECT 'Starting Query 2: Parks with Most Basketball Courts' AS '';
SELECT '========================================' AS '';
SELECT 
    p.park_id,
    p.park_name,
    p.borough,
    COUNT(f.facility_id) AS basketball_court_count
FROM Park p
JOIN Facility f ON p.park_id = f.park_id
WHERE f.facility_type = 'Basketball'
GROUP BY p.park_id, p.park_name, p.borough
HAVING COUNT(f.facility_id) >= (
    SELECT AVG(court_count)
    FROM (
        SELECT COUNT(*) AS court_count
        FROM Facility
        WHERE facility_type = 'Basketball'
        GROUP BY park_id
    ) AS subquery
)
ORDER BY basketball_court_count DESC
LIMIT 15;

-- Query 3: Comparison between lighting and unlighting parks
SELECT '========================================' AS '';
SELECT 'Starting Query 3: Lighting Comparison' AS '';
SELECT '========================================' AS '';
SELECT 
    'With Lighting' AS facility_lighting,
    COUNT(DISTINCT p.park_id) AS park_count,
    ROUND(AVG(p.avg_rating), 2) AS avg_rating,
    ROUND(AVG(p.acres), 2) AS avg_acres
FROM Park p
JOIN Facility f ON p.park_id = f.park_id
WHERE f.is_lighted = TRUE
GROUP BY f.is_lighted

UNION

SELECT 
    'Without Lighting' AS facility_lighting,
    COUNT(DISTINCT p.park_id) AS park_count,
    ROUND(AVG(p.avg_rating), 2) AS avg_rating,
    ROUND(AVG(p.acres), 2) AS avg_acres
FROM Park p
JOIN Facility f ON p.park_id = f.park_id
WHERE f.is_lighted = FALSE
GROUP BY f.is_lighted

LIMIT 15;

-- Query 4: The park with Facilities and trails
SELECT '========================================' AS '';
SELECT 'Starting Query 4: Parks with Facilities and Trails' AS '';
SELECT '========================================' AS '';
SELECT 
    p.park_id,
    p.park_name,
    p.borough,
    COUNT(DISTINCT f.facility_type) AS facility_types,
    COUNT(DISTINCT t.trail_id) AS trail_count,
    ROUND(p.acres, 2) AS park_size_acres
FROM Park p
JOIN Facility f ON p.park_id = f.park_id
JOIN Trail t ON p.park_id = t.park_id
WHERE p.acres > (
    SELECT AVG(acres)
    FROM Park
    WHERE acres IS NOT NULL
)
GROUP BY p.park_id, p.park_name, p.borough, p.acres
ORDER BY facility_types DESC, trail_count DESC
LIMIT 15;