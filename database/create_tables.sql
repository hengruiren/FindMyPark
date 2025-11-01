DROP DATABASE IF EXISTS findmypark_nyc;
CREATE DATABASE findmypark_nyc;
USE findmypark_nyc;

-- 1. User Table
DROP TABLE IF EXISTS User;
CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Park Table
DROP TABLE IF EXISTS Park;
CREATE TABLE Park (
    park_id VARCHAR(50) PRIMARY KEY COMMENT 'GISPROPNUM from Parks Properties',
    park_name VARCHAR(200) NOT NULL,
    park_size DECIMAL(10,2),

    borough VARCHAR(255),
    zipcode VARCHAR(10),
    latitude DECIMAL(10,8) NOT NULL COMMENT 'For map display',
    longitude DECIMAL(11,8) NOT NULL COMMENT 'For map display',

    park_type VARCHAR(50),
    acres DECIMAL(10,2) COMMENT 'Park size for scoring',
    is_waterfront BOOLEAN DEFAULT FALSE,

    avg_rating DECIMAL(3,2)

);

-- 3. Facility Table
DROP TABLE IF EXISTS Facility;
CREATE TABLE Facility (
    facility_id INT PRIMARY KEY AUTO_INCREMENT,
    park_id VARCHAR(50) NOT NULL,

    facility_type ENUM(
        'Basketball', 'Tennis', 'Soccer', 'Baseball', 'Softball',
        'Football', 'Volleyball', 'Track', 'Handball',
        'Pickleball', 'Hockey', 'Cricket', 'Rugby', 'Bocce',
        'Lacrosse', 'Frisbee', 'Kickball', 'Netball'
    ) NOT NULL,
    dimensions VARCHAR(100),

    surface_type VARCHAR(50) COMMENT 'Natural grass, synthetic, asphalt, etc.',
    is_lighted BOOLEAN DEFAULT FALSE,
    is_accessible BOOLEAN DEFAULT FALSE COMMENT 'ADA accessible',
    field_condition VARCHAR(200),

    avg_facility_rating DECIMAL(3,2) DEFAULT 0.00,
    total_facility_reviews INT DEFAULT 0,

    FOREIGN KEY (park_id) REFERENCES Park(park_id) ON DELETE CASCADE

);

-- 4. Trail Table
DROP TABLE IF EXISTS Trail;
CREATE TABLE Trail (
    trail_id INT PRIMARY KEY AUTO_INCREMENT,
    park_id VARCHAR(50) NOT NULL,
    
    trail_name VARCHAR(200),
    width_ft VARCHAR(50),
    surface VARCHAR(50) COMMENT 'Paved, dirt, gravel, etc.',
    difficulty VARCHAR(200),
    -- length_miles DECIMAL(6,2),
    
    has_trail_markers BOOLEAN DEFAULT FALSE,
    
    avg_trail_rating DECIMAL(3,2) DEFAULT 0.00,
    total_trail_reviews INT DEFAULT 0,
    
    
    FOREIGN KEY (park_id) REFERENCES Park(park_id) ON DELETE CASCADE
    
);

-- 5. Review Table
DROP TABLE IF EXISTS Review;
CREATE TABLE Review (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    park_id VARCHAR(50),
    facility_id INT,
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    comment TEXT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (park_id) REFERENCES Park(park_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES Facility(facility_id) ON DELETE SET NULL

);


SHOW TABLES;