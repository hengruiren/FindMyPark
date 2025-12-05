-- ============================================================
-- TRIGGERS (for programmatic execution)
-- ============================================================

USE findmypark_nyc;

-- Trigger 1: Auto-update Park Rating after Review INSERT
DROP TRIGGER IF EXISTS AfterReviewInsert;
CREATE TRIGGER AfterReviewInsert
AFTER INSERT ON Review
FOR EACH ROW
BEGIN
    IF NEW.park_id IS NOT NULL THEN
        CALL UpdateParkRating(NEW.park_id);
    END IF;
    
    IF NEW.facility_id IS NOT NULL THEN
        CALL UpdateFacilityRating(NEW.facility_id);
    END IF;
END;

-- Trigger 2: Auto-update Park Rating after Review UPDATE
DROP TRIGGER IF EXISTS AfterReviewUpdate;
CREATE TRIGGER AfterReviewUpdate
AFTER UPDATE ON Review
FOR EACH ROW
BEGIN
    IF NEW.park_id IS NOT NULL AND (OLD.rating != NEW.rating OR OLD.park_id != NEW.park_id) THEN
        CALL UpdateParkRating(NEW.park_id);
        
        IF OLD.park_id IS NOT NULL AND OLD.park_id != NEW.park_id THEN
            CALL UpdateParkRating(OLD.park_id);
        END IF;
    END IF;
    
    IF NEW.facility_id IS NOT NULL AND (OLD.rating != NEW.rating OR OLD.facility_id != NEW.facility_id) THEN
        CALL UpdateFacilityRating(NEW.facility_id);
        
        IF OLD.facility_id IS NOT NULL AND OLD.facility_id != NEW.facility_id THEN
            CALL UpdateFacilityRating(OLD.facility_id);
        END IF;
    END IF;
END;

-- Trigger 3: Auto-update Park Rating after Review DELETE
DROP TRIGGER IF EXISTS AfterReviewDelete;
CREATE TRIGGER AfterReviewDelete
AFTER DELETE ON Review
FOR EACH ROW
BEGIN
    IF OLD.park_id IS NOT NULL THEN
        CALL UpdateParkRating(OLD.park_id);
    END IF;
    
    IF OLD.facility_id IS NOT NULL THEN
        CALL UpdateFacilityRating(OLD.facility_id);
    END IF;
END;



