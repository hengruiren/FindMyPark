/**
 * Script to check User table structure
 * Run with: node check_database.js
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

async function checkDatabase() {
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

        console.log("Connected to database...\n");

        // Check User table structure
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'User'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME || "findmypark_nyc"]);

        console.log("📋 User table structure:");
        console.log("=" .repeat(80));
        console.log(
            "Column Name".padEnd(20) + 
            "Data Type".padEnd(20) + 
            "Nullable".padEnd(10) + 
            "Default".padEnd(15) + 
            "Comment"
        );
        console.log("-".repeat(80));

        columns.forEach(col => {
            console.log(
                col.COLUMN_NAME.padEnd(20) + 
                col.DATA_TYPE.padEnd(20) + 
                col.IS_NULLABLE.padEnd(10) + 
                (col.COLUMN_DEFAULT || 'NULL').padEnd(15) + 
                (col.COLUMN_COMMENT || '')
            );
        });

        console.log("-".repeat(80));
        console.log(`\nTotal columns: ${columns.length}`);

        // Check if favorites column exists
        const favoritesColumn = columns.find(col => col.COLUMN_NAME === 'favorites');
        if (favoritesColumn) {
            console.log("\n✅ 'favorites' column exists!");
            console.log(`   Type: ${favoritesColumn.COLUMN_TYPE}`);
            console.log(`   Comment: ${favoritesColumn.COLUMN_COMMENT || 'None'}`);
        } else {
            console.log("\n❌ 'favorites' column does NOT exist!");
            console.log("   Please run: node add_favorites_column.js");
        }

        // Check for sample data
        const [sampleUsers] = await connection.execute(`
            SELECT user_id, username, email, 
                   preferences IS NOT NULL as has_preferences,
                   favorites IS NOT NULL as has_favorites,
                   COALESCE(CHAR_LENGTH(favorites), 0) as favorites_length
            FROM User
            LIMIT 5
        `);

        console.log("\n📊 Sample User data:");
        console.log("=" .repeat(80));
        if (sampleUsers.length > 0) {
            console.log(
                "User ID".padEnd(10) + 
                "Username".padEnd(20) + 
                "Has Prefs".padEnd(12) + 
                "Has Favs".padEnd(12) + 
                "Favs Length"
            );
            console.log("-".repeat(80));
            sampleUsers.forEach(user => {
                console.log(
                    user.user_id.toString().padEnd(10) + 
                    (user.username || '').padEnd(20) + 
                    (user.has_preferences ? 'Yes' : 'No').padEnd(12) + 
                    (user.has_favorites ? 'Yes' : 'No').padEnd(12) + 
                    user.favorites_length
                );
            });
        } else {
            console.log("No users found in database.");
        }

        console.log("\n✅ Database check completed!");
        
    } catch (error) {
        console.error("❌ Error checking database:", error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log("\nDatabase connection closed.");
        }
    }
}

// Run the script
checkDatabase().catch(console.error);



