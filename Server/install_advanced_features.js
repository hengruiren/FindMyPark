/**
 * Script to install stored procedures and triggers
 * Run with: node Server/install_advanced_features.js
 */

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function installAdvancedFeatures() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "NewPassword123!",
            database: process.env.DB_NAME || "findmypark_nyc",
            port: process.env.DB_PORT || 3306,
            multipleStatements: true, // Allow multiple statements
        });

        console.log("Connected to database...\n");

        // Install stored procedures
        console.log("📦 Installing stored procedures...");
        const storedProceduresSQL = fs.readFileSync(
            path.join(__dirname, "../database/stored_procedures_no_delimiter.sql"),
            "utf8"
        );
        await connection.query(storedProceduresSQL);
        console.log("✅ Stored procedures installed successfully!\n");

        // Install triggers
        console.log("⚡ Installing triggers...");
        const triggersSQL = fs.readFileSync(
            path.join(__dirname, "../database/triggers_no_delimiter.sql"),
            "utf8"
        );
        await connection.query(triggersSQL);
        console.log("✅ Triggers installed successfully!\n");

        // Verify installation
        console.log("🔍 Verifying installation...\n");
        
        // Check stored procedures
        const [procedures] = await connection.execute(
            `SHOW PROCEDURE STATUS WHERE Db = ?`,
            [process.env.DB_NAME || "findmypark_nyc"]
        );
        console.log(`📦 Stored Procedures (${procedures.length}):`);
        procedures.forEach(proc => {
            console.log(`   - ${proc.Name}`);
        });
        
        // Check triggers
        const [triggers] = await connection.execute(
            `SHOW TRIGGERS FROM ${process.env.DB_NAME || "findmypark_nyc"}`
        );
        console.log(`\n⚡ Triggers (${triggers.length}):`);
        triggers.forEach(trigger => {
            console.log(`   - ${trigger.Trigger} (${trigger.Event} ${trigger.Table})`);
        });

        console.log("\n✅ All advanced features installed successfully!");
        
    } catch (error) {
        console.error("❌ Error installing advanced features:", error.message);
        if (error.sqlMessage) {
            console.error("SQL Error:", error.sqlMessage);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log("\nDatabase connection closed.");
        }
    }
}

// Run the script
installAdvancedFeatures().catch(console.error);

