-- Add favorites column to existing User table
-- Run this if the database already exists without the favorites column

USE findmypark_nyc;

ALTER TABLE User 
ADD COLUMN favorites TEXT COMMENT 'JSON array of favorite park_ids' 
AFTER preferences;

