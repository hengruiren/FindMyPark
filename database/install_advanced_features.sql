-- ============================================================
-- INSTALL ADVANCED DATABASE FEATURES
-- ============================================================
-- This script installs all stored procedures and triggers
-- Run: mysql -u root -p findmypark_nyc < database/install_advanced_features.sql
-- Or: mysql -u root -p < database/install_advanced_features.sql

USE findmypark_nyc;

-- Install stored procedures
SOURCE database/stored_procedures.sql;

-- Install triggers
SOURCE database/triggers.sql;

-- Verify installation
SELECT 'Stored Procedures Installed:' AS '';
SHOW PROCEDURE STATUS WHERE Db = 'findmypark_nyc';

SELECT 'Triggers Installed:' AS '';
SHOW TRIGGERS FROM findmypark_nyc;

SELECT 'Installation Complete!' AS '';



