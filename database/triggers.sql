-- ============================================================
-- TRIGGERS
-- ============================================================

USE findmypark_nyc;

DELIMITER $$

-- Trigger 1: Auto-update Park Rating after Review INSERT
-- Event: INSERT on Review table
-- Condition: IF park_id is not NULL
-- Action: UPDATE Park.avg_rating
DROP TRIGGER IF EXISTS AfterReviewInsert$$
CREATE TRIGGER AfterReviewInsert
AFTER INSERT ON Review
FOR EACH ROW
BEGIN
    -- Condition: IF park_id is not NULL
    IF NEW.park_id IS NOT NULL THEN
        -- Action: UPDATE park rating using stored procedure
        CALL UpdateParkRating(NEW.park_id);
    END IF;
    
    -- Condition: IF facility_id is not NULL
    IF NEW.facility_id IS NOT NULL THEN
        -- Action: UPDATE facility rating using stored procedure
        CALL UpdateFacilityRating(NEW.facility_id);
    END IF;
END$$

-- Trigger 2: Auto-update Park Rating after Review UPDATE
-- Event: UPDATE on Review table
-- Condition: IF park_id or rating changed
-- Action: UPDATE Park.avg_rating
DROP TRIGGER IF EXISTS AfterReviewUpdate$$
CREATE TRIGGER AfterReviewUpdate
AFTER UPDATE ON Review
FOR EACH ROW
BEGIN
    -- Condition: IF park_id is not NULL and rating or park_id changed
    IF NEW.park_id IS NOT NULL AND (OLD.rating != NEW.rating OR OLD.park_id != NEW.park_id) THEN
        -- Action: UPDATE park rating
        CALL UpdateParkRating(NEW.park_id);
        
        -- Also update old park if park_id changed
        IF OLD.park_id IS NOT NULL AND OLD.park_id != NEW.park_id THEN
            CALL UpdateParkRating(OLD.park_id);
        END IF;
    END IF;
    
    -- Condition: IF facility_id is not NULL and rating or facility_id changed
    IF NEW.facility_id IS NOT NULL AND (OLD.rating != NEW.rating OR OLD.facility_id != NEW.facility_id) THEN
        -- Action: UPDATE facility rating
        CALL UpdateFacilityRating(NEW.facility_id);
        
        -- Also update old facility if facility_id changed
        IF OLD.facility_id IS NOT NULL AND OLD.facility_id != NEW.facility_id THEN
            CALL UpdateFacilityRating(OLD.facility_id);
        END IF;
    END IF;
END$$

-- Trigger 3: Auto-update Park Rating after Review DELETE
-- Event: DELETE on Review table
-- Condition: IF park_id is not NULL
-- Action: UPDATE Park.avg_rating
DROP TRIGGER IF EXISTS AfterReviewDelete$$
CREATE TRIGGER AfterReviewDelete
AFTER DELETE ON Review
FOR EACH ROW
BEGIN
    -- Condition: IF park_id is not NULL
    IF OLD.park_id IS NOT NULL THEN
        -- Action: UPDATE park rating
        CALL UpdateParkRating(OLD.park_id);
    END IF;
    
    -- Condition: IF facility_id is not NULL
    IF OLD.facility_id IS NOT NULL THEN
        -- Action: UPDATE facility rating
        CALL UpdateFacilityRating(OLD.facility_id);
    END IF;
END$$

DELIMITER ;

