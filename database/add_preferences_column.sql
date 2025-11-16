-- Add preferences column to existing User table
-- Run this if the database already exists without the preferences column

USE findmypark_nyc;

ALTER TABLE User 
ADD COLUMN preferences TEXT COMMENT 'JSON string for user preferences (favorite facilities, display settings)' 
AFTER password_hash;



