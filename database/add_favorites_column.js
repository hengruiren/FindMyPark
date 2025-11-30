/**
 * Script to add favorites column to User table
 * Run with: node database/add_favorites_column.js
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

async function addFavoritesColumn() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "NewPassword123!",
            database: process.env.DB_NAME || "findmypark_nyc",
            port: process.env.DB_PORT || 3306,
        });

        console.log("Connected to database...");

        // Check if column already exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'User' AND COLUMN_NAME = 'favorites'
        `, [process.env.DB_NAME || "findmypark_nyc"]);

        if (columns.length > 0) {
            console.log("✅ Column 'favorites' already exists in User table.");
            return;
        }

        // Add favorites column
        await connection.execute(`
            ALTER TABLE User 
            ADD COLUMN favorites TEXT COMMENT 'JSON array of favorite park_ids' 
            AFTER preferences
        `);

        console.log("✅ Successfully added 'favorites' column to User table!");
        
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("✅ Column 'favorites' already exists in User table.");
        } else {
            console.error("❌ Error adding favorites column:", error.message);
            process.exit(1);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log("Database connection closed.");
        }
    }
}

// Run the script
addFavoritesColumn().catch(console.error);



